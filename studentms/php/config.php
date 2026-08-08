<?php
// api/config.php

// CORS and response headers
if (php_sapi_name() !== 'cli') {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header("Content-Type: application/json; charset=UTF-8");

    if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        exit(0);
    }

    // Start PHP session
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
}

// Database configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'studentms');

try {
    // Connect to MySQL server first (without database)
    $pdo = new PDO("mysql:host=" . DB_HOST . ";charset=utf8mb4", DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    
    // Create database if not exists
    $pdo->exec("CREATE DATABASE IF NOT EXISTS " . DB_NAME);
    $pdo->exec("USE " . DB_NAME);
    
    // Admins Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // Students Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        roll VARCHAR(50) NOT NULL UNIQUE,
        age INT NOT NULL,
        dob DATE NOT NULL,
        department VARCHAR(50) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        phone VARCHAR(20) NOT NULL,
        gender VARCHAR(20) NOT NULL,
        address TEXT NOT NULL,
        password VARCHAR(255) NOT NULL,
        photo VARCHAR(255) DEFAULT NULL,
        father_name VARCHAR(100) DEFAULT NULL,
        mother_name VARCHAR(100) DEFAULT NULL,
        parent_contact VARCHAR(20) DEFAULT NULL,
        id_type VARCHAR(50) DEFAULT NULL,
        id_number VARCHAR(100) DEFAULT NULL,
        id_doc VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // Dynamic Alterations for Compatibility
    $cols = $pdo->query("SHOW COLUMNS FROM students")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('father_name', $cols)) {
        $pdo->exec("ALTER TABLE students ADD COLUMN father_name VARCHAR(100) DEFAULT NULL AFTER photo");
    }
    if (!in_array('mother_name', $cols)) {
        $pdo->exec("ALTER TABLE students ADD COLUMN mother_name VARCHAR(100) DEFAULT NULL AFTER father_name");
    }
    if (!in_array('parent_contact', $cols)) {
        $pdo->exec("ALTER TABLE students ADD COLUMN parent_contact VARCHAR(20) DEFAULT NULL AFTER mother_name");
    }
    if (!in_array('id_type', $cols)) {
        $pdo->exec("ALTER TABLE students ADD COLUMN id_type VARCHAR(50) DEFAULT NULL AFTER parent_contact");
    }
    if (!in_array('id_number', $cols)) {
        $pdo->exec("ALTER TABLE students ADD COLUMN id_number VARCHAR(100) DEFAULT NULL AFTER id_type");
    }
    if (!in_array('id_doc', $cols)) {
        $pdo->exec("ALTER TABLE students ADD COLUMN id_doc VARCHAR(255) DEFAULT NULL AFTER id_number");
    }
    if (!in_array('year', $cols)) {
        $pdo->exec("ALTER TABLE students ADD COLUMN year INT NOT NULL DEFAULT 1 AFTER department");
    }
    if (!in_array('status', $cols)) {
        $pdo->exec("ALTER TABLE students ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'Active' AFTER id_doc");
    }

    // Attendance Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_roll VARCHAR(50) NOT NULL,
        date DATE NOT NULL,
        status ENUM('Present', 'Absent') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_roll) REFERENCES students(roll) ON DELETE CASCADE ON UPDATE CASCADE,
        UNIQUE KEY roll_date (student_roll, date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // Seed default admin if table is empty
    $stmt = $pdo->query("SELECT COUNT(*) FROM admins");
    if ($stmt->fetchColumn() == 0) {
        $defaultPassword = password_hash('admin123', PASSWORD_BCRYPT);
        $pdo->exec("INSERT INTO admins (name, email, password) VALUES ('shree', 'shree@college.edu', '$defaultPassword')");
    }

    // Seed default students if table is empty
    $stmt = $pdo->query("SELECT COUNT(*) FROM students");
    if ($stmt->fetchColumn() == 0) {
        $defaultPassword = password_hash('password123', PASSWORD_BCRYPT);
        
        $stmtInsert = $pdo->prepare("INSERT INTO students (name, roll, age, dob, department, email, phone, gender, address, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        
        $stmtInsert->execute(["Shreedhar G", "411723106078", 20, "2006-05-15", "ECE", "shreedharg@gmail.com", "987456154", "Male", "12 MG Road, Bangalore, Karnataka", $defaultPassword]);
        $stmtInsert->execute(["Manoj S", "411723106051", 21, "2005-08-22", "ECE", "manoj@example.com", "987456155", "Male", "45 Park Street, Chennai, Tamil Nadu", $defaultPassword]);
        $stmtInsert->execute(["Priya K", "411723106099", 19, "2007-01-10", "CSE", "priya@example.com", "987456156", "Female", "88 Ring Road, Bangalore, Karnataka", $defaultPassword]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Database connection or initialization failed: " . $e->getMessage()
    ]);
    exit();
}

// Helper function to send JSON response
function sendResponse($status, $message, $data = [], $code = 200) {
    http_response_code($code);
    echo json_encode(array_merge([
        "status" => $status,
        "message" => $message
    ], $data));
    exit();
}

// Helper to verify if admin is logged in
function requireAdmin() {
    if (!isset($_SESSION['admin_id'])) {
        sendResponse("error", "Unauthorized: Please log in first.", [], 401);
    }
}
?>
