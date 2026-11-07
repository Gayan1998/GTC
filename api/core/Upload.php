<?php
declare(strict_types=1);

/**
 * Safe image upload handling.
 *
 * Validates the upload error code, size, real MIME type and image structure,
 * generates a random filename, stores it under uploads/YYYY/MM/ and records it
 * in the media table.
 */
class Upload
{
    /**
     * @param array<string,mixed> $file A single entry from $_FILES.
     * @return string Relative public path, e.g. uploads/2025/06/ab12cd.webp
     */
    public static function image(array $file): string
    {
        $error = (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE);
        if ($error !== UPLOAD_ERR_OK) {
            Response::error(self::errorMessage($error), 400);
        }

        $tmp = (string) ($file['tmp_name'] ?? '');
        if ($tmp === '' || !is_uploaded_file($tmp)) {
            Response::error('The uploaded file could not be read.', 400);
        }

        $maxBytes = (int) Config::get('app.max_upload_bytes', 5242880);
        $size = (int) ($file['size'] ?? 0);
        if ($size <= 0 || $size > $maxBytes) {
            Response::error('The image is larger than the ' . round($maxBytes / 1048576, 1) . ' MB limit.', 400);
        }

        // Real MIME type from file contents, not the client-supplied type.
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = (string) $finfo->file($tmp);
        $allowed = (array) Config::get('app.allowed_mimes', []);
        if (!isset($allowed[$mime])) {
            Response::error('Only JPEG, PNG and WebP images are allowed.', 400);
        }

        $info = @getimagesize($tmp);
        if ($info === false) {
            Response::error('The uploaded file is not a valid image.', 400);
        }

        $ext = (string) $allowed[$mime];
        $relativeDir = 'uploads/' . date('Y/m');
        $absoluteDir = rtrim((string) Config::get('app.upload_dir'), '/\\') . '/' . date('Y/m');
        if (!is_dir($absoluteDir) && !@mkdir($absoluteDir, 0755, true) && !is_dir($absoluteDir)) {
            Response::error('The upload directory is not writable.', 500);
        }

        $filename = bin2hex(random_bytes(10)) . '.' . $ext;
        $absolutePath = $absoluteDir . '/' . $filename;
        if (!move_uploaded_file($tmp, $absolutePath)) {
            Response::error('The image could not be saved.', 500);
        }
        @chmod($absolutePath, 0644);

        $relativePath = $relativeDir . '/' . $filename;
        Database::query(
            'INSERT INTO media (filename, path, mime_type, width, height, size_bytes) VALUES (?, ?, ?, ?, ?, ?)',
            [$filename, $relativePath, $mime, (int) $info[0], (int) $info[1], $size]
        );

        return $relativePath;
    }

    private static function errorMessage(int $code): string
    {
        switch ($code) {
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                return 'The uploaded image is too large.';
            case UPLOAD_ERR_PARTIAL:
                return 'The image was only partially uploaded.';
            case UPLOAD_ERR_NO_FILE:
                return 'No image was uploaded.';
            default:
                return 'The image could not be uploaded.';
        }
    }

    /** Best-effort deletion of a file under uploads/, guarded against traversal. */
    public static function deleteFile(string $relativePath): void
    {
        $base = realpath((string) Config::get('app.upload_dir'));
        if ($base === false) {
            return;
        }
        $candidate = realpath(dirname((string) Config::get('app.upload_dir')) . '/' . $relativePath);
        if ($candidate === false || strpos($candidate, $base) !== 0 || !is_file($candidate)) {
            return;
        }
        @unlink($candidate);
    }
}
