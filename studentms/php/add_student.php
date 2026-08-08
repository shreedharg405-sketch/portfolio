<?php
// api/add_student.php
require_once 'config.php';
requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse("error", "Method not allowed. Use POST.", [], 405);
}

// Extract inputs from $_POST
$name = isset($_POST['name']) ? trim($_POST['name']) : '';
$roll = isset($_POST['roll']) ? trim($_POST['roll']) : '';
$age = isset($_POST['age']) ? intval($_POST['age']) : 0;
$dob = isset($_POST['dob']) ? trim($_POST['dob']) : '';
$department = isset($_POST['department']) ? trim($_POST['department']) : '';
$email = isset($_POST['email']) ? trim($_POST['email']) : '';
$phone = isset($_POST['phone']) ? trim($_POST['phone']) : '';
$gender = isset($_POST['gender']) ? trim($_POST['gender']) : '';
$address = isset($_POST['address']) ? trim($_POST['address']) : '';
$password = isset($_POST['password']) ? $_POST['password'] : '';

// Step 2 Parent & ID Proof optional/additional fields
$father_name = isset($_POST['father_name']) ? trim($_POST['father_name']) : null;
$mother_name = isset($_POST['mother_name']) ? trim($_POST['mother_name']) : null;
$parent_contact = isset($_POST['parent_contact']) ? trim($_POST['parent_contact']) : null;
$id_type = isset($_POST['id_type']) ? trim($_POST['id_type']) : null;
$id_number = isset($_POST['id_number']) ? trim($_POST['id_number']) : null;

// Validation checks - ONLY Name and Roll Number are compulsory
if (empty($name) || empty($roll)) {
    sendResponse("error", "Name and Roll/Registration Number are compulsory.", [], 400);
}

if (strlen($name) < 2) {
    sendResponse("error", "Name must be at least 2 characters.", [], 400);
}

if (!preg_match('/^[a-zA-Z0-9-]{3,20}$/', $roll)) {
    sendResponse("error", "Roll number must be 3-20 alphanumeric characters.", [], 400);
}

// Sensible fallbacks for optional fields if omitted
if (empty($email)) {
    $email = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $roll)) . '@student.com';
}
if ($age <= 0) {
    $age = 18;
}
if (empty($dob)) {
    $dob = '2000-01-01';
}
if (empty($department)) {
    $department = 'General';
}
if (empty($gender)) {
    $gender = 'Other';
}
if (empty($address)) {
    $address = 'N/A';
}
if (empty($password)) {
    $password = '123456';
}

try {
    // Check duplicate roll number
    $stmtRoll = $pdo->prepare("SELECT id FROM students WHERE LOWER(roll) = LOWER(?)");
    $stmtRoll->execute([$roll]);
    if ($stmtRoll->fetch()) {
        sendResponse("error", "Conflict: Roll number already exists.", [], 409);
    }

    // Check duplicate email
    $stmtEmail = $pdo->prepare("SELECT id FROM students WHERE LOWER(email) = LOWER(?)");
    $stmtEmail->execute([$email]);
    if ($stmtEmail->fetch()) {
        sendResponse("error", "Conflict: Email already exists.", [], 409);
    }

    // Handle student photo upload
    $photoPath = null;
    if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
        $fileTmpPath = $_FILES['photo']['tmp_name'];
        $fileName = $_FILES['photo']['name'];
        $fileSize = $_FILES['photo']['size'];
        
        $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        $allowedExtensions = ['png', 'jpg', 'jpeg', 'gif'];
        
        if (!in_array($fileExtension, $allowedExtensions)) {
            sendResponse("error", "Invalid photo format. Only PNG, JPG, JPEG, and GIF are allowed.", [], 400);
        }
        
        if ($fileSize > 5 * 1024 * 1024) {
            sendResponse("error", "Photo size exceeds the limit of 5MB.", [], 400);
        }
        
        $uploadDir = '../uploads/students/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        $newFileName = time() . '_' . uniqid() . '.' . $fileExtension;
        $destPath = $uploadDir . $newFileName;
        
        if (move_uploaded_file($fileTmpPath, $destPath)) {
            $photoPath = 'uploads/students/' . $newFileName;
        } else {
            sendResponse("error", "Failed to save uploaded photo file.", [], 500);
        }
    }

    // Handle ID Document upload
    $idDocPath = null;
    if (isset($_FILES['id_doc']) && $_FILES['id_doc']['error'] === UPLOAD_ERR_OK) {
        $docTmpPath = $_FILES['id_doc']['tmp_name'];
        $docName = $_FILES['id_doc']['name'];
        $docExtension = strtolower(pathinfo($docName, PATHINFO_EXTENSION));
        $allowedDocExts = ['pdf', 'png', 'jpg', 'jpeg'];

        if (in_array($docExtension, $allowedDocExts)) {
            $docDir = '../uploads/documents/';
            if (!is_dir($docDir)) {
                mkdir($docDir, 0755, true);
            }
            $newDocName = 'doc_' . time() . '_' . uniqid() . '.' . $docExtension;
            $destDocPath = $docDir . $newDocName;

            if (move_uploaded_file($docTmpPath, $destDocPath)) {
                $idDocPath = 'uploads/documents/' . $newDocName;
            }
        }
    }

    // Hash the password
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

    // Insert complete student profile
    $stmtInsert = $pdo->prepare("
        INSERT INTO students (
            name, roll, age, dob, department, email, phone, gender, address, password, photo,
            father_name, mother_name, parent_contact, id_type, id_number, id_doc
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmtInsert->execute([
        $name, $roll, $age, $dob, $department, $email, $phone, $gender, $address, $hashedPassword, $photoPath,
        $father_name, $mother_name, $parent_contact, $id_type, $id_number, $idDocPath
    ]);

    $studentId = $pdo->lastInsertId();

    sendResponse("success", "Student registered successfully.", [
        "student" => [
            "id" => str_pad($studentId, 3, "0", STR_PAD_LEFT),
            "name" => $name,
            "roll" => $roll,
            "photo" => $photoPath
        ]
    ]);

} catch (PDOException $e) {
    sendResponse("error", "Database error: " . $e->getMessage(), [], 500);
}
?>
