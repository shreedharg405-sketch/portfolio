-- MySQL Portfolio Database Schema Update - 4 Projects

USE `portfolio`;

-- 1. Ensure sort_order and subtitle columns exist
ALTER TABLE `projects` ADD COLUMN IF NOT EXISTS `sort_order` INT NOT NULL DEFAULT 1 AFTER `id`;
ALTER TABLE `projects` ADD COLUMN IF NOT EXISTS `subtitle` VARCHAR(255) NULL AFTER `title`;

-- 2. Clear existing projects and insert all 4 in exact required order
TRUNCATE TABLE `projects`;

INSERT INTO `projects` (`id`, `sort_order`, `title`, `subtitle`, `description`, `technologies`, `github_link`, `live_link`, `image`) VALUES
(1, 1, 'Student Management System (SMS)', 'Comprehensive Academic Portal', 'A comprehensive web application designed to manage student records, course registrations, department analytics, and attendance tracking efficiently with an interactive admin dashboard.', 'HTML5, CSS3, JavaScript, PHP, MySQL', 'https://github.com', 'http://localhost/studentms/html/login.html', 'images/projects/student-management-system.jpg'),
(2, 2, 'Sovereign Awards', 'Awards / Recognition Platform', 'A global awards and recognition platform for Crypto, Forex, Payments, and Fintech sectors. Designed around recognizing achievements, category nominations, ticket bookings, sponsorship details, and event highlights.', 'HTML5, CSS3, JavaScript, Bootstrap, PHP, MySQL', 'https://github.com', 'sovreign.html', 'assets/projects/sovereign-awards/awardslogo.png'),
(3, 3, 'Embedded Smart Poultry Farm Control System', 'Automated Climate Control System', 'Developed an Arduino Uno based Smart Poultry Farm Control System capable of monitoring temperature and humidity using a DHT11 sensor. Automated heater, intake fan, and exhaust fan using relay modules to maintain optimal environmental conditions and reduce manual monitoring.', 'Arduino Uno, DHT11, Relay Module, Embedded C, Embedded Systems', 'https://github.com', 'https://example.com', 'images/projects/smart-poultry-farm.jpg'),
(4, 4, 'Smart Lume', 'IoT-Based Smart Street Light System', 'Smart Lume is an IoT-based Smart Street Light System designed to improve energy efficiency and reduce unnecessary power consumption. The system uses an LDR sensor to detect ambient light intensity and a PIR sensor to detect the presence of pedestrians or vehicles. A microcontroller such as ESP32/Arduino processes the sensor inputs and controls the LED street light based on environmental conditions and detected motion. The system is powered by a solar panel and battery unit, providing an energy-efficient power source. The lighting automatically turns ON during low-light conditions and adjusts brightness when motion is detected. IoT integration can additionally provide remote monitoring and control for smart-city applications.', 'ESP32 / Arduino, LDR Sensor, PIR Sensor, LED Street Light, Solar Panel, Battery, IoT, Embedded Systems', 'https://github.com', 'https://example.com', 'images/projects/smart-lume.jpg');

-- 3. Query projects ordered by sort_order ASC
SELECT `id`, `sort_order`, `title`, `subtitle`, `image` FROM `projects` ORDER BY `sort_order` ASC;
