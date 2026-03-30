<?php
/**
 * Database Configuration and Connection Handler
 * Uses PDO for secure database operations
 */

class Database
{
    private static $instance = null;
    private $conn;

    private $host;
    private $port;
    private $db_name;
    private $username;
    private $password;

    public function __construct()
    {
        // Load from environment variables (.env file)
        $this->host = getenv('DB_HOST') ?: 'localhost';
        $this->port = getenv('DB_PORT') ?: '3306';
        $this->db_name = getenv('DB_NAME') ?: 'canteen_feedback';
        $this->username = getenv('DB_USER') ?: 'feedback_user';
        $this->password = getenv('DB_PASSWORD') ?: 'feedback123';
    }

    private function initConnection()
    {
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";port=" . $this->port . ";dbname=" . $this->db_name . ";charset=utf8mb4",
                $this->username,
                $this->password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]
            );
        } catch (PDOException $e) {
            error_log("Connection Error: " . $e->getMessage());
            throw new Exception("Database connection failed");
        }
    }

    public static function getInstance()
    {
        if (self::$instance === null) {
            self::$instance = new self();
            self::$instance->initConnection();
        }
        return self::$instance;
    }

    public function getConnection()
    {
        return $this->conn;
    }

    public static function query($sql, $params = [])
    {
        try {
            $conn = self::getInstance()->getConnection();
            $stmt = $conn->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (Exception $e) {
            error_log("Query Error: " . $e->getMessage());
            throw new Exception("Database query failed: " . $e->getMessage());
        }
    }

    public static function fetchOne($sql, $params = [])
    {
        $stmt = self::query($sql, $params);
        return $stmt->fetch();
    }

    public static function fetchAll($sql, $params = [])
    {
        $stmt = self::query($sql, $params);
        return $stmt->fetchAll();
    }

    public static function execute($sql, $params = [])
    {
        $stmt = self::query($sql, $params);
        return $stmt->rowCount();
    }

    public static function lastInsertId()
    {
        return self::getInstance()->getConnection()->lastInsertId();
    }

    public static function beginTransaction()
    {
        return self::getInstance()->getConnection()->beginTransaction();
    }

    public static function commit()
    {
        return self::getInstance()->getConnection()->commit();
    }

    public static function rollback()
    {
        // Check if transaction is active to avoid error on rollback
        if (self::getInstance()->getConnection()->inTransaction()) {
            return self::getInstance()->getConnection()->rollBack();
        }
        return false;
    }
}
