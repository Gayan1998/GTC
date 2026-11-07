<?php
declare(strict_types=1);

/**
 * PDO database connection (lazy singleton).
 */
class Database
{
    private static ?PDO $pdo = null;

    public static function pdo(): PDO
    {
        if (self::$pdo instanceof PDO) {
            return self::$pdo;
        }

        $host    = (string) Config::get('db.host', '127.0.0.1');
        $port    = (int) Config::get('db.port', 3306);
        $name    = (string) Config::get('db.name', '');
        $charset = (string) Config::get('db.charset', 'utf8mb4');

        $dsn = "mysql:host={$host};port={$port};dbname={$name};charset={$charset}";
        self::$pdo = new PDO(
            $dsn,
            (string) Config::get('db.user', ''),
            (string) Config::get('db.pass', ''),
            [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]
        );
        return self::$pdo;
    }

    /** Run a prepared query and return the statement. */
    public static function query(string $sql, array $params = []): PDOStatement
    {
        $stmt = self::pdo()->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    public static function fetch(string $sql, array $params = []): ?array
    {
        $row = self::query($sql, $params)->fetch();
        return $row === false ? null : $row;
    }

    public static function fetchAll(string $sql, array $params = []): array
    {
        return self::query($sql, $params)->fetchAll();
    }

    public static function lastInsertId(): int
    {
        return (int) self::pdo()->lastInsertId();
    }
}
