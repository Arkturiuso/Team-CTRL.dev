-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
-- Host: 127.0.0.1    Database: robocode

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `account_status`;
CREATE TABLE `account_status` (
  `account_status_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`account_status_id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `account_status` VALUES (1,'active'),(2,'blocked');

DROP TABLE IF EXISTS `app_user`;
CREATE TABLE `app_user` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `login` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `registration` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `account_status_id` int NOT NULL,
  `role` enum('player','admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'player',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `login` (`login`),
  KEY `fk_user_account_status` (`account_status_id`),
  CONSTRAINT `fk_user_account_status` FOREIGN KEY (`account_status_id`) REFERENCES `account_status` (`account_status_id`)
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `app_user` VALUES (1,'admin','admin123','2026-10-05 09:11:00',1,'admin'),(2,'player1','player123','2026-10-05 09:11:00',1,'player'),(3,'player2','player456','2026-10-05 09:11:00',1,'player'),(4,'dmitry_volkov','V0lkov!2024','2026-08-12 09:14:00',1,'player'),(5,'anna_smirnova','Sm!rn0va#88','2026-08-13 11:02:00',1,'player'),(6,'sergey_kozlov','K0zl0v$77','2026-08-14 13:47:00',1,'player'),(7,'elena_popova','P0p0va_2024','2026-08-15 08:30:00',1,'player'),(8,'andrey_novikov','N0v1k0v!15','2026-08-16 16:25:00',1,'player'),(9,'maria_ivanova','1van0va_maria','2026-08-17 10:10:00',1,'player'),(10,'pavel_morozov','M0r0z0v#pavel','2026-08-18 12:55:00',1,'player'),(11,'olga_sokolova','S0k0l0va!olga','2026-08-19 14:38:00',1,'player'),(12,'ivan_petrov','P3tr0v_ivan','2026-08-20 09:05:00',1,'player'),(13,'natalya_lebedeva','L3b3d3va_nat','2026-08-21 15:22:00',1,'player'),(14,'alexey_orlov','0rl0v_alexey','2026-08-22 11:47:00',1,'player'),(15,'tatyana_zhukova','Zhuk0va_tat','2026-08-23 08:19:00',1,'player'),(16,'mikhail_vlasov','Vlas0v_mikhail','2026-08-24 17:03:00',1,'player'),(17,'irina_belova','Bel0va_irina','2026-08-25 13:36:00',1,'player'),(18,'nikolay_gusev','Gus3v_nikolay','2026-08-26 10:44:00',1,'player'),(19,'svetlana_fedorova','F3d0r0va_svet','2026-08-27 12:28:00',1,'player'),(20,'artem_kiselev','K1s3l3v_artem','2026-08-28 09:51:00',1,'player'),(21,'yulia_komarova','K0mar0va_yul','2026-08-29 16:14:00',1,'player'),(22,'denis_titov','T1t0v_denis','2026-08-30 11:20:00',1,'player'),(23,'alina_kuznetsova','Kuzn3ts0va_al','2026-08-31 14:07:00',1,'player'),(24,'vladimir_egorov','3g0r0v_vlad','2026-09-01 08:42:00',1,'player'),(25,'ekaterina_pavlova','Pavl0va_ekat','2026-09-02 10:33:00',1,'player'),(26,'roman_semenov','S3m3n0v_roman','2026-09-03 12:18:00',1,'player'),(27,'daria_golubeva','G0lub3va_dar','2026-09-04 15:49:00',1,'player'),(28,'maxim_vinogradov','V1n0grad0v_max','2026-09-05 09:27:00',1,'player'),(29,'ksenia_bogdanova','B0gdan0va_ks','2026-09-06 11:56:00',1,'player'),(30,'igor_karpov','Karp0v_igor','2026-09-07 14:11:00',1,'player'),(31,'vera_afanasyeva','Afanasy3va_v','2026-09-08 08:05:00',1,'player'),(32,'oleg_danilov','Dan1l0v_oleg','2026-09-09 16:37:00',1,'player'),(33,'polina_ershkova','3rshk0va_pol','2026-09-10 10:22:00',1,'player'),(34,'stanislav_kruglov','Krugl0v_stan','2026-09-11 13:44:00',1,'player'),(35,'lyudmila_tihonova','T1h0n0va_lyud','2026-09-12 09:18:00',2,'player'),(36,'gleb_shubin','Shub1n_gleb','2026-09-13 12:31:00',1,'player'),(37,'viktoria_merkush','M3rkush_vikt','2026-09-14 15:09:00',1,'player'),(38,'fedor_polyakov','P0lyak0v_fed','2026-09-15 08:53:00',1,'player'),(39,'zoya_rogova','R0g0va_zoya','2026-09-16 11:40:00',1,'player'),(40,'vasily_kalinin','Kal1n1n_vas','2026-09-17 14:27:00',1,'player'),(41,'nina_lebedeva','L3b3d3va_nina','2026-09-18 10:15:00',1,'player'),(42,'konstantin_mironov','M1r0n0v_kost','2026-09-19 13:02:00',1,'player'),(43,'lidia_zakharova','Zakhar0va_lid','2026-09-20 16:48:00',1,'player'),(44,'anatoly_bobrov','B0br0v_anat','2026-09-21 09:36:00',1,'player'),(45,'galina_kotova','K0t0va_gal','2026-09-22 12:21:00',2,'player'),(46,'timur_nikitin','N1k1t1n_timur','2026-09-23 15:54:00',1,'player'),(47,'alisa_krylova','Kryl0va_alisa','2026-09-24 08:47:00',1,'player'),(48,'boris_savelev','Sav3l3v_boris','2026-09-25 11:12:00',1,'player'),(49,'marina_ilina','1l1na_marina','2026-09-26 14:39:00',1,'player'),(50,'egor_soloviev','S0l0v3v_egor','2026-09-27 10:26:00',1,'player'),(51,'anna_makarova','Makar0va_anna','2026-09-28 13:13:00',1,'player'),(52,'kirill_baranov','Baran0v_kirill','2026-09-29 16:58:00',1,'player'),(53,'alexandra_zueva','Zu3va_alex','2026-09-30 09:41:00',1,'player');

DROP TABLE IF EXISTS `attempt`;
CREATE TABLE `attempt` (
  `attempt_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `level_id` int NOT NULL,
  `source_code` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `submitted` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `attempt_status_id` int NOT NULL,
  `tick_count` int DEFAULT NULL,
  `lines_count` int DEFAULT NULL,
  `error_message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`attempt_id`),
  KEY `fk_attempt_user` (`user_id`),
  KEY `fk_attempt_level` (`level_id`),
  KEY `fk_attempt_status` (`attempt_status_id`),
  CONSTRAINT `fk_attempt_level` FOREIGN KEY (`level_id`) REFERENCES `level` (`level_id`),
  CONSTRAINT `fk_attempt_status` FOREIGN KEY (`attempt_status_id`) REFERENCES `attempt_status` (`attempt_status_id`),
  CONSTRAINT `fk_attempt_user` FOREIGN KEY (`user_id`) REFERENCES `app_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `attempt_status`;
CREATE TABLE `attempt_status` (
  `attempt_status_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`attempt_status_id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `attempt_status` VALUES (1,'in_progress'),(2,'success'),(3,'error');

DROP TABLE IF EXISTS `command`;
CREATE TABLE `command` (
  `command_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `syntax` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`command_id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `command` VALUES 
(1,'move','robot.move()','Шаг вперёд на одну клетку. Если впереди стена или препятствие - ошибка.'),
(2,'turn_left','robot.turn_left()','Повернуть налево на 90 градусов.'),
(3,'turn_right','robot.turn_right()','Повернуть направо на 90 градусов.'),
(6,'attack','robot.attack()','Атаковать врага прямо перед роботом.'),
(8,'for','for i in range(n):','Цикл for: повторить блок n раз или пройти по списку.'),
(10,'def','def имя():','Определить функцию - многоразовый блок кода.'),
(11,'print','print(...)','Печатает текст или значение в консоль под кодом - удобно проверять переменные и ход программы.');

DROP TABLE IF EXISTS `difficulty`;
CREATE TABLE `difficulty` (
  `difficulty_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`difficulty_id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `difficulty` VALUES (1,'easy'),(2,'medium'),(3,'hard'),(4,'expert');

DROP TABLE IF EXISTS `knowledge_base`;
CREATE TABLE `knowledge_base` (
  `user_id` int NOT NULL,
  `command_id` int NOT NULL,
  PRIMARY KEY (`user_id`,`command_id`),
  KEY `fk_kb_command` (`command_id`),
  CONSTRAINT `fk_kb_command` FOREIGN KEY (`command_id`) REFERENCES `command` (`command_id`),
  CONSTRAINT `fk_kb_user` FOREIGN KEY (`user_id`) REFERENCES `app_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `leaderboard`;
CREATE TABLE `leaderboard` (
  `position` int NOT NULL,
  `user_id` int NOT NULL,
  `login` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_score` int NOT NULL DEFAULT '0',
  `updated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`position`),
  UNIQUE KEY `uq_leaderboard_user` (`user_id`),
  CONSTRAINT `fk_leaderboard_user` FOREIGN KEY (`user_id`) REFERENCES `app_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `leaderboard` VALUES (1,4,'dmitry_volkov',3700,'2026-10-19 09:09:05'),(2,5,'anna_smirnova',2445,'2026-10-19 09:09:05'),(3,12,'ivan_petrov',1375,'2026-10-19 09:09:05'),(4,20,'artem_kiselev',1370,'2026-10-19 09:09:05'),(5,28,'maxim_vinogradov',995,'2026-10-19 09:09:05'),(6,16,'mikhail_vlasov',975,'2026-10-19 09:09:05'),(7,26,'roman_semenov',975,'2026-10-19 09:09:05'),(8,8,'andrey_novikov',965,'2026-10-19 09:09:05'),(9,6,'sergey_kozlov',625,'2026-10-19 09:09:05'),(10,7,'elena_popova',610,'2026-10-19 09:09:05'),(11,18,'nikolay_gusev',600,'2026-10-19 09:09:05'),(12,34,'stanislav_kruglov',600,'2026-10-19 09:09:05'),(13,9,'maria_ivanova',580,'2026-10-19 09:09:05'),(14,31,'vera_afanasyeva',580,'2026-10-19 09:09:05'),(15,23,'alina_kuznetsova',565,'2026-10-19 09:09:05'),(16,11,'olga_sokolova',555,'2026-10-19 09:09:05'),(17,25,'ekaterina_pavlova',540,'2026-10-19 09:09:05'),(18,14,'alexey_orlov',530,'2026-10-19 09:09:05'),(19,19,'svetlana_fedorova',340,'2026-10-19 09:09:05'),(20,30,'igor_karpov',340,'2026-10-19 09:09:05'),(21,21,'yulia_komarova',330,'2026-10-19 09:09:05'),(22,10,'pavel_morozov',325,'2026-10-19 09:09:05'),(23,32,'oleg_danilov',320,'2026-10-19 09:09:05'),(24,24,'vladimir_egorov',310,'2026-10-19 09:09:05'),(25,13,'natalya_lebedeva',305,'2026-10-19 09:09:05'),(26,27,'daria_golubeva',290,'2026-10-19 09:09:05'),(27,15,'tatyana_zhukova',285,'2026-10-19 09:09:05'),(28,17,'irina_belova',75,'2026-10-19 09:09:05'),(29,22,'denis_titov',70,'2026-10-19 09:09:05'),(30,29,'ksenia_bogdanova',70,'2026-10-19 09:09:05'),(31,33,'polina_ershkova',65,'2026-10-19 09:09:05'),(32,35,'lyudmila_tihonova',60,'2026-10-19 09:09:05'),(33,36,'gleb_shubin',55,'2026-10-19 09:09:05'),(34,37,'viktoria_merkush',50,'2026-10-19 09:09:05'),(35,38,'fedor_polyakov',45,'2026-10-19 09:09:05'),(36,39,'zoya_rogova',40,'2026-10-19 09:09:05'),(37,40,'vasily_kalinin',35,'2026-10-19 09:09:05'),(38,42,'konstantin_mironov',30,'2026-10-19 09:09:05'),(39,43,'lidia_zakharova',25,'2026-10-19 09:09:05'),(40,44,'anatoly_bobrov',20,'2026-10-19 09:09:05'),(41,46,'timur_nikitin',15,'2026-10-19 09:09:05'),(42,47,'alisa_krylova',10,'2026-10-19 09:09:05'),(43,48,'boris_savelev',5,'2026-10-19 09:09:05');

DROP TABLE IF EXISTS `level`;
CREATE TABLE `level` (
  `level_id` int NOT NULL AUTO_INCREMENT,
  `map_data` json NOT NULL,
  `difficulty_id` int NOT NULL,
  `level_status_id` int NOT NULL,
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`level_id`),
  KEY `fk_level_difficulty` (`difficulty_id`),
  KEY `fk_level_status` (`level_status_id`),
  CONSTRAINT `fk_level_difficulty` FOREIGN KEY (`difficulty_id`) REFERENCES `difficulty` (`difficulty_id`),
  CONSTRAINT `fk_level_status` FOREIGN KEY (`level_status_id`) REFERENCES `level_status` (`level_status_id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `level` VALUES 
(1,'{"exit":"G1","hint":"robot.move() делает один шаг вперёд. Вызови его шесть раз подряд. print(''текст'') выводит сообщение в консоль под кодом - удобно проверять, что происходит.","keys":[{"id":1,"position":"E1"}],"biome":"forest","coins":[{"id":1,"position":"B1"},{"id":2,"position":"C1"},{"id":3,"position":"D1"},{"id":4,"position":"F1"}],"rocks":[],"walls":[],"width":7,"height":1,"enemies":[],"version":2,"entrance":"A1","level_name":"Лесная тропа","description":"Солнечная поляна на опушке леса. Собери ключ и дойди до выхода.","three_star_runs":3,"entrance_direction":"right","required_key_position":"E1"}',1,1,'2026-10-26 10:00:00'),
(2,'{"exit":"E5","hint":"robot.turn_right() поворачивает направо, robot.turn_left() - налево. Поворот тоже тратит тик.","keys":[{"id":1,"position":"C1"}],"biome":"forest","coins":[{"id":1,"position":"B1"},{"id":2,"position":"D1"},{"id":3,"position":"E4"}],"rocks":["B2","A3","C4","D3"],"walls":[],"width":5,"height":5,"enemies":[],"version":2,"entrance":"A1","level_name":"Первый поворот","description":"Тропа уходит вправо и поворачивает вниз. Научись разворачивать робота.","three_star_runs":3,"entrance_direction":"right","required_key_position":"C1"}',1,1,'2026-10-26 10:00:00'),
(3,'{"exit":"A7","hint":"for i in range(6): robot.move() - шесть шагов вправо. Затем robot.turn_right() и снова цикл, чтобы пройти вниз и влево.","keys":[{"id":1,"position":"C1"}],"biome":"forest","coins":[{"id":1,"position":"B1"},{"id":2,"position":"E1"},{"id":3,"position":"G3"},{"id":4,"position":"G6"},{"id":5,"position":"D7"}],"rocks":["B3","C4","D2","E4","F3","B5"],"walls":[],"width":7,"height":7,"enemies":[],"version":2,"entrance":"A1","level_name":"Лесной завал","description":"Деревья перекрыли путь. Проложи маршрут и повтори шаги циклом for.","three_star_runs":4,"entrance_direction":"right","required_key_position":"C1"}',2,1,'2026-10-26 10:00:00'),
(4,'{"exit":"A8","hint":"for i in range(7): robot.move() - семь шагов. Затем поворот и снова цикл.","keys":[{"id":1,"position":"D1"}],"biome":"forest","coins":[{"id":1,"position":"F1"},{"id":2,"position":"H4"},{"id":3,"position":"F8"},{"id":4,"position":"B8"}],"rocks":["B3","C4","D5","E3","F5","G2","B6","D6"],"walls":[],"width":8,"height":8,"enemies":[],"version":2,"entrance":"A1","level_name":"Двойная петля","description":"Большая поляна. Повторяющиеся действия лучше поручить циклу for.","three_star_runs":4,"entrance_direction":"right","required_key_position":"D1"}',2,1,'2026-10-26 10:00:00'),
(5,'{"exit":"G7","hint":"Лёд сам несёт робота вперёд. Разбей маршрут на короткие циклы for и не забывай поворачивать.","keys":[{"id":1,"position":"C1"}],"biome":"snow","coins":[{"id":1,"position":"B1"},{"id":2,"position":"E1"},{"id":3,"position":"G3"},{"id":4,"position":"G6"}],"rocks":["B3","C4","D5","E3","F4","B5"],"walls":[],"width":7,"height":7,"enemies":[],"terrain":{"D1":"ice","E1":"ice","F1":"ice","G4":"ice","G5":"ice","G6":"ice"},"version":2,"entrance":"A1","level_name":"Ледяной разлом","description":"Снежные пустоши. На льду робот скользит, пока не остановится у препятствия.","three_star_runs":4,"entrance_direction":"right","required_key_position":"C1"}',2,1,'2026-10-26 10:00:00'),
(6,'{"exit":"I9","hint":"Волк украл ключ и сторожит его на I5. Подойди к I4 и вызови robot.attack(), затем забери ключ на клетке волка.","keys":[{"id":1,"position":"I5"}],"biome":"snow","coins":[{"id":1,"position":"D1"},{"id":2,"position":"H1"},{"id":3,"position":"I3"},{"id":4,"position":"I7"}],"rocks":["C3","D4","E5","F6","G3","B6","D7"],"walls":[],"width":9,"height":9,"enemies":[{"id":1,"type":"wolf","patrol":["I5"],"position":"I5","move_every":3,"carries_key":true},{"id":2,"type":"snowman","patrol":["H6","H7"],"position":"H6","move_every":2}],"version":2,"entrance":"A1","level_name":"Волчья тропа","description":"В снежном лесу волк украл ключ. Победи вора, забери ключ и доберись до выхода.","three_star_runs":5,"entrance_direction":"right","required_key_position":"I5"}',3,1,'2026-10-26 10:00:00'),
(7,'{"exit":"A10","hint":"Опиши def walk(n), которая делает n шагов, и вызывай её для каждой стороны зала.","keys":[{"id":1,"position":"C1"}],"biome":"cave","coins":[{"id":1,"position":"E1"},{"id":2,"position":"I1"},{"id":3,"position":"J5"},{"id":4,"position":"J9"},{"id":5,"position":"F10"},{"id":6,"position":"B10"}],"rocks":["C4","D3","E5","F4","G6","H3","B5","D7","F7","H8"],"walls":[],"width":10,"height":10,"enemies":[{"id":1,"type":"golem","patrol":["E10"],"position":"E10","move_every":3},{"id":2,"type":"slime","position":"D5","patrol":["D5","D6"],"move_every":2}],"version":2,"entrance":"A1","level_name":"Пещера эха","description":"Подземный лабиринт. Здесь пригодится собственная функция: один раз описал - много раз вызвал.","three_star_runs":5,"entrance_direction":"right","required_key_position":"C1"}',3,1,'2026-10-26 10:00:00'),
(8,'{"exit":"J10","hint":"Путь змеится: вправо, вниз, влево, вниз и снова вправо. Вынеси шаги с атакой в функцию.","keys":[{"id":1,"position":"E1"}],"biome":"desert","coins":[{"id":1,"position":"D1"},{"id":2,"position":"H1"},{"id":3,"position":"I4"},{"id":4,"position":"F6"},{"id":5,"position":"B8"},{"id":6,"position":"H10"}],"rocks":["A3","B3","C3","D3","E3","F3","G3","H3","C8","D8","E8","F8","G8","H8","I8","J8","C9","D9","E9","F9","G9","H9","I9","J9"],"walls":[],"width":10,"height":10,"enemies":[{"id":1,"type":"scorpion","patrol":["F1"],"position":"F1","move_every":3},{"id":2,"type":"vulture","patrol":["J3","J4"],"position":"J3","move_every":2},{"id":3,"type":"golem","patrol":["E10"],"position":"E10","move_every":3}],"version":2,"entrance":"A1","level_name":"Пустыня забытых стен","description":"Раскалённые пески. Стены образуют длинный змеиный коридор, а скорпионы охраняют проходы.","three_star_runs":6,"entrance_direction":"right","required_key_position":"E1"}',4,1,'2026-10-26 10:00:00'),
(9,'{"exit":"L12","hint":"Используй функции и циклы. Каждый шаг по грязи стоит дополнительный тик.","keys":[{"id":1,"position":"F6"}],"biome":"swamp","coins":[{"id":1,"position":"B1"},{"id":2,"position":"D1"},{"id":3,"position":"I1"},{"id":4,"position":"K1"},{"id":5,"position":"K3"},{"id":6,"position":"F8"},{"id":7,"position":"F11"},{"id":8,"position":"H12"}],"rocks":["B4","C7","D9","E6","G3","H5","I8","J4","K7","C10","L1"],"walls":[],"width":12,"height":12,"enemies":[{"id":1,"type":"slime","patrol":["K5"],"position":"K5","move_every":3},{"id":2,"type":"slime","patrol":["F7"],"position":"F7","move_every":3},{"id":3,"type":"bat","patrol":["I11","J11"],"position":"I11","move_every":2}],"terrain":{"F9":"mud","K2":"mud","K4":"mud","H12":"mud"},"version":2,"entrance":"A1","level_name":"Гнилое болото","description":"Трясина замедляет робота. Обязательный ключ спрятан в глубине, а топь кишит слизнями.","three_star_runs":6,"entrance_direction":"right","required_key_position":"F6"}',4,1,'2026-10-26 10:00:00'),
(10,'{"exit":"L12","hint":"Собери все монеты, чтобы снять щит босса. Подойди к L12, вызови robot.attack() три раза и войди в выход.","keys":[{"id":1,"position":"G6"}],"biome":"volcano","coins":[{"id":1,"position":"C1"},{"id":2,"position":"I1"},{"id":3,"position":"K1"},{"id":4,"position":"K3"},{"id":5,"position":"F8"},{"id":6,"position":"F11"},{"id":7,"position":"H12"},{"id":8,"position":"J12"}],"rocks":["B3","D3","G2","I4","C8","D8","G9","H9","B10","C10","F3","E6"],"walls":[],"width":12,"height":12,"enemies":[{"id":1,"type":"golem","patrol":["H6"],"position":"H6","move_every":3},{"id":2,"type":"golem","patrol":["F10"],"position":"F10","move_every":3},{"id":3,"type":"golem","position":"L12","patrol":["L12"],"move_every":3,"boss":true,"hp":3}],"version":2,"entrance":"A1","level_name":"Сердце вулкана","description":"В жерле вулкана проснулся каменный босс. Его щит держится, пока на карте остаются монеты.","three_star_runs":6,"entrance_direction":"right","required_key_position":"G6"}',4,1,'2026-10-26 10:00:00'),
(11,'{"exit":"I9","hint":"Сначала пройди вниз до первого коридора, затем двигайся по змейке. Помогут циклы for и свои функции.","keys":[{"id":1,"position":"E5"}],"biome":"forest","coins":[{"id":1,"position":"A2"},{"id":2,"position":"E4"},{"id":3,"position":"H5"},{"id":4,"position":"B5"},{"id":5,"position":"C8"},{"id":6,"position":"I8"}],"rocks":[],"walls":[{"side1":"B2","side2":"B3"},{"side1":"C2","side2":"C3"},{"side1":"D2","side2":"D3"},{"side1":"E2","side2":"E3"},{"side1":"F2","side2":"F3"},{"side1":"G2","side2":"G3"},{"side1":"H2","side2":"H3"},{"side1":"I2","side2":"I3"},{"side1":"A4","side2":"A5"},{"side1":"B4","side2":"B5"},{"side1":"C4","side2":"C5"},{"side1":"D4","side2":"D5"},{"side1":"E4","side2":"E5"},{"side1":"F4","side2":"F5"},{"side1":"G4","side2":"G5"},{"side1":"H4","side2":"H5"},{"side1":"B6","side2":"B7"},{"side1":"C6","side2":"C7"},{"side1":"D6","side2":"D7"},{"side1":"E6","side2":"E7"},{"side1":"F6","side2":"F7"},{"side1":"G6","side2":"G7"},{"side1":"H6","side2":"H7"},{"side1":"I6","side2":"I7"},{"side1":"A8","side2":"A9"},{"side1":"B8","side2":"B9"},{"side1":"C8","side2":"C9"},{"side1":"D8","side2":"D9"},{"side1":"E8","side2":"E9"},{"side1":"F8","side2":"F9"},{"side1":"G8","side2":"G9"},{"side1":"H8","side2":"H9"}],"width":9,"height":9,"enemies":[],"version":2,"entrance":"A1","level_name":"Мшистый лабиринт","description":"Старый лесной лабиринт: длинные коридоры, редкие повороты и ключ где-то в середине пути.","three_star_runs":4,"entrance_direction":"right","required_key_position":"E5"}',2,1,'2026-11-02 10:00:00'),
(12,'{"exit":"I9","hint":"Планируй остановки заранее: после шага на лёд робот проедет ещё несколько клеток. Поворачивай только после остановки.","keys":[{"id":1,"position":"E4"}],"biome":"snow","coins":[{"id":1,"position":"D1"},{"id":2,"position":"D2"},{"id":3,"position":"E5"},{"id":4,"position":"E6"},{"id":5,"position":"I7"},{"id":6,"position":"I8"}],"rocks":["E1","D5","H4","C7","G8","B5","F2"],"walls":[],"width":9,"height":9,"enemies":[],"terrain":{"B1":"ice","B6":"ice","C1":"ice","C6":"ice","D1":"ice","D3":"ice","D6":"ice","E3":"ice","F3":"ice","F7":"ice","G7":"ice","H7":"ice"},"version":2,"entrance":"A1","level_name":"Ледяные виражи","description":"Снежное плато покрыто полосами льда. Робот скользит вперёд, пока не упрётся в препятствие.","three_star_runs":4,"entrance_direction":"right","required_key_position":"E4"}',2,1,'2026-11-02 10:00:00'),
(13,'{"exit":"I9","hint":"Подойди к слизню вплотную и вызови robot.attack(), затем шагай через проход. На грязи каждый шаг стоит два тика.","keys":[{"id":1,"position":"D6"}],"biome":"swamp","coins":[{"id":1,"position":"B1"},{"id":2,"position":"D1"},{"id":3,"position":"D3"},{"id":4,"position":"D5"},{"id":5,"position":"D9"},{"id":6,"position":"F9"},{"id":7,"position":"H9"}],"rocks":["C3","C4","C5","C6","E3","E4","E5","E6","F8","H6"],"walls":[],"width":9,"height":9,"enemies":[{"id":1,"type":"slime","patrol":["D5"],"position":"D5","move_every":3},{"id":2,"type":"slime","patrol":["G8","H8"],"position":"G8","move_every":3}],"terrain":{"B2":"mud","C2":"mud","F5":"mud","G5":"mud"},"version":2,"entrance":"A1","level_name":"Трясина и слизни","description":"Болото затягивает шаги, а в узком проходе дежурит слизень. Без атаки дальше не пройти.","three_star_runs":5,"entrance_direction":"right","required_key_position":"D6"}',3,1,'2026-11-02 10:00:00'),
(14,'{"exit":"J10","hint":"Гриф унёс ключ и сидит на I5. Подойди к H5, атакуй грифа и забери ключ.","keys":[{"id":1,"position":"I5"}],"biome":"desert","coins":[{"id":1,"position":"B1"},{"id":2,"position":"D1"},{"id":3,"position":"F2"},{"id":4,"position":"F5"},{"id":5,"position":"I5"},{"id":6,"position":"J6"},{"id":7,"position":"J9"}],"rocks":["B7","E8","C9","G3"],"walls":[{"side1":"A3","side2":"A4"},{"side1":"B3","side2":"B4"},{"side1":"C3","side2":"C4"},{"side1":"D3","side2":"D4"},{"side1":"E3","side2":"E4"},{"side1":"G3","side2":"G4"},{"side1":"H3","side2":"H4"},{"side1":"I3","side2":"I4"},{"side1":"J3","side2":"J4"},{"side1":"A7","side2":"A8"},{"side1":"B7","side2":"B8"},{"side1":"C7","side2":"C8"},{"side1":"D7","side2":"D8"},{"side1":"E7","side2":"E8"},{"side1":"F7","side2":"F8"},{"side1":"G7","side2":"G8"},{"side1":"H7","side2":"H8"},{"side1":"I7","side2":"I8"}],"width":10,"height":10,"enemies":[{"id":1,"type":"scorpion","patrol":["F4"],"position":"F4","move_every":3},{"id":2,"type":"vulture","patrol":["I5"],"position":"I5","move_every":2,"carries_key":true}],"version":2,"entrance":"A1","level_name":"Песчаные ворота","description":"Пустынные стены делят плато на ярусы. Гриф украл ключ, а скорпион сторожит первый проход.","three_star_runs":5,"entrance_direction":"right","required_key_position":"I5"}',3,1,'2026-11-02 10:00:00'),
(15,'{"exit":"K11","hint":"Иди вниз до дальнего прохода, через зал поднимайся наверх и переходи в следующий зал. Голема в проходе снимай атакой.","keys":[{"id":1,"position":"E6"}],"biome":"cave","coins":[{"id":1,"position":"B1"},{"id":2,"position":"D5"},{"id":3,"position":"E10"},{"id":4,"position":"E3"},{"id":5,"position":"H1"},{"id":6,"position":"K4"},{"id":7,"position":"K10"}],"rocks":["B3","C8","F8","H5","I4"],"walls":[{"side1":"D1","side2":"E1"},{"side1":"D2","side2":"E2"},{"side1":"D3","side2":"E3"},{"side1":"D4","side2":"E4"},{"side1":"D5","side2":"E5"},{"side1":"D6","side2":"E6"},{"side1":"D7","side2":"E7"},{"side1":"D8","side2":"E8"},{"side1":"D9","side2":"E9"},{"side1":"H2","side2":"I2"},{"side1":"H3","side2":"I3"},{"side1":"H4","side2":"I4"},{"side1":"H5","side2":"I5"},{"side1":"H6","side2":"I6"},{"side1":"H7","side2":"I7"},{"side1":"H8","side2":"I8"},{"side1":"H9","side2":"I9"},{"side1":"H10","side2":"I10"},{"side1":"H11","side2":"I11"}],"width":11,"height":11,"enemies":[{"id":1,"type":"golem","patrol":["E10"],"position":"E10","move_every":3},{"id":2,"type":"bat","patrol":["F5","G5","H5"],"position":"F5","move_every":2}],"version":2,"entrance":"A1","level_name":"Гулкие залы","description":"Три пещерных зала соединены узкими проходами. В первом проходе стоит голем, во втором кружит летучая мышь.","three_star_runs":5,"entrance_direction":"right","required_key_position":"E6"}',3,1,'2026-11-02 10:00:00'),
(16,'{"exit":"J10","hint":"Двигайся по коридорам до разрывов в стенах. Перед големом остановись и атакуй, иначе проход не открыть.","keys":[{"id":1,"position":"D5"}],"biome":"volcano","coins":[{"id":1,"position":"B1"},{"id":2,"position":"B6"},{"id":3,"position":"D9"},{"id":4,"position":"D2"},{"id":5,"position":"H1"},{"id":6,"position":"J4"},{"id":7,"position":"J9"}],"rocks":["C1","C2","C3","C4","C5","C6","C7","C8","F2","F3","F4","F5","F6","F7","F8","F9","I2","I3","I4","I5","I6","I7","I8","I9","I10"],"walls":[],"width":10,"height":10,"enemies":[{"id":1,"type":"golem","patrol":["D9"],"position":"D9","move_every":3},{"id":2,"type":"golem","patrol":["G1"],"position":"G1","move_every":3},{"id":3,"type":"bat","patrol":["H5","H6"],"position":"H5","move_every":2}],"version":2,"entrance":"A1","level_name":"Лавовые мосты","description":"Узкие каменные коридоры вьются между лавовых стен. На двух переходах путь держат големы.","three_star_runs":5,"entrance_direction":"right","required_key_position":"D5"}',3,1,'2026-11-02 10:00:00'),
(17,'{"exit":"K11","hint":"Волк украл ключ и сидит на F6. Подойди к F5, атакуй волка и забери ключ. Снеговик патрулирует справа.","keys":[{"id":1,"position":"F6"}],"biome":"snow","coins":[{"id":1,"position":"B1"},{"id":2,"position":"E1"},{"id":3,"position":"F3"},{"id":4,"position":"F5"},{"id":5,"position":"F9"},{"id":6,"position":"G11"},{"id":7,"position":"J11"}],"rocks":["C3","I3","C9","I9","E8","G4","H8"],"walls":[],"width":11,"height":11,"enemies":[{"id":1,"type":"wolf","patrol":["F6"],"position":"F6","move_every":3,"carries_key":true},{"id":2,"type":"snowman","patrol":["H9","H10"],"position":"H9","move_every":2}],"terrain":{"B7":"ice","C7":"ice","J5":"ice","J6":"ice"},"version":2,"entrance":"A1","level_name":"Морозный дозор","description":"Морозный дозор охраняет перевал. Волк украл ключ, а снеговик ходит по правому краю плато.","three_star_runs":6,"entrance_direction":"right","required_key_position":"F6"}',3,1,'2026-11-02 10:00:00'),
(18,'{"exit":"L12","hint":"Войди в зал через верхний разрыв, а выйди через боковой. На грязи шаг занимает два тика, поэтому атакуй до входа.","keys":[{"id":1,"position":"F6"}],"biome":"swamp","coins":[{"id":1,"position":"B1"},{"id":2,"position":"E1"},{"id":3,"position":"G2"},{"id":4,"position":"G5"},{"id":5,"position":"G7"},{"id":6,"position":"J7"},{"id":7,"position":"L8"},{"id":8,"position":"L11"}],"rocks":["E5","F5","H5","I5","E9","F9","G9","H9","I9","E6","E7","E8","I6","I8"],"walls":[],"width":12,"height":12,"enemies":[{"id":1,"type":"slime","patrol":["G6"],"position":"G6","move_every":3},{"id":2,"type":"slime","patrol":["F7"],"position":"F7","move_every":3},{"id":3,"type":"slime","patrol":["H7"],"position":"H7","move_every":3},{"id":4,"type":"bat","patrol":["J8","J9"],"position":"J8","move_every":2}],"terrain":{"D4":"mud","D5":"mud","F7":"mud","G5":"mud","H7":"mud","I8":"mud"},"version":2,"entrance":"A1","level_name":"Затонувший храм","description":"Полузатопленный храм с запертым залом в центре. Ключ лежит внутри, но вход охраняют слизни.","three_star_runs":6,"entrance_direction":"right","required_key_position":"F6"}',4,1,'2026-11-02 10:00:00'),
(19,'{"exit":"L12","hint":"Скорпион украл ключ и сидит на F7. Подойди к F6, атакуй скорпиона и забери ключ.","keys":[{"id":1,"position":"F7"}],"biome":"desert","coins":[{"id":1,"position":"B1"},{"id":2,"position":"B4"},{"id":3,"position":"B6"},{"id":4,"position":"E6"},{"id":5,"position":"I6"},{"id":6,"position":"L6"},{"id":7,"position":"L8"},{"id":8,"position":"L11"}],"rocks":["C3","D3","E4","F4","G5","H5","C8","D8","E8","G2","H2","I2","F9","G9"],"walls":[],"width":12,"height":12,"enemies":[{"id":1,"type":"scorpion","patrol":["F7"],"position":"F7","move_every":3,"carries_key":true},{"id":2,"type":"vulture","patrol":["C4","D4"],"position":"C4","move_every":2},{"id":3,"type":"golem","patrol":["I8","J8"],"position":"I8","move_every":3}],"version":2,"entrance":"A1","level_name":"Буря в пустыне","description":"Открытая пустыня с каменными грядами. Скорпион украл ключ, а гриф и голем патрулируют плато.","three_star_runs":6,"entrance_direction":"right","required_key_position":"F7"}',4,1,'2026-11-02 10:00:00'),
(20,'{"exit":"L12","hint":"Собери все монеты, чтобы снять щит босса. Подойди к L12, вызови robot.attack() три раза и войди в выход.","keys":[{"id":1,"position":"G6"}],"biome":"cave","coins":[{"id":1,"position":"B1"},{"id":2,"position":"C5"},{"id":3,"position":"C10"},{"id":4,"position":"D10"},{"id":5,"position":"D1"},{"id":6,"position":"G3"},{"id":7,"position":"G11"},{"id":8,"position":"K12"}],"rocks":[],"walls":[{"side1":"C1","side2":"D1"},{"side1":"C2","side2":"D2"},{"side1":"C3","side2":"D3"},{"side1":"C4","side2":"D4"},{"side1":"C5","side2":"D5"},{"side1":"C6","side2":"D6"},{"side1":"C7","side2":"D7"},{"side1":"C8","side2":"D8"},{"side1":"C9","side2":"D9"},{"side1":"C10","side2":"D10"},{"side1":"C11","side2":"D11"},{"side1":"F2","side2":"G2"},{"side1":"F3","side2":"G3"},{"side1":"F4","side2":"G4"},{"side1":"F5","side2":"G5"},{"side1":"F6","side2":"G6"},{"side1":"F7","side2":"G7"},{"side1":"F8","side2":"G8"},{"side1":"F9","side2":"G9"},{"side1":"F10","side2":"G10"},{"side1":"F11","side2":"G11"},{"side1":"F12","side2":"G12"},{"side1":"I1","side2":"J1"},{"side1":"I2","side2":"J2"},{"side1":"I3","side2":"J3"},{"side1":"I4","side2":"J4"},{"side1":"I5","side2":"J5"},{"side1":"I6","side2":"J6"},{"side1":"I7","side2":"J7"},{"side1":"I8","side2":"J8"},{"side1":"I9","side2":"J9"},{"side1":"I10","side2":"J10"},{"side1":"I11","side2":"J11"}],"width":12,"height":12,"enemies":[{"id":1,"type":"golem","patrol":["D12"],"position":"D12","move_every":3},{"id":3,"type":"golem","patrol":["J12"],"position":"J12","move_every":3},{"id":4,"type":"golem","position":"L12","patrol":["L12"],"move_every":3,"boss":true,"hp":3}],"terrain":{"B6":"mud","D3":"ice","D4":"ice","D5":"ice","E7":"mud","G8":"ice","G9":"ice","H4":"mud","J3":"ice","J4":"ice","K8":"mud"},"version":2,"entrance":"A1","level_name":"Стеклянный каньон","description":"Стеклянный каньон ведёт к каменному боссу. Его щит держится, пока на карте остаются монеты.","three_star_runs":7,"entrance_direction":"right","required_key_position":"G6"}',4,1,'2026-11-02 10:00:00');

DROP TABLE IF EXISTS `level_command`;
CREATE TABLE `level_command` (
  `level_id` int NOT NULL,
  `command_id` int NOT NULL,
  PRIMARY KEY (`level_id`,`command_id`),
  KEY `fk_lc_command` (`command_id`),
  CONSTRAINT `fk_lc_command` FOREIGN KEY (`command_id`) REFERENCES `command` (`command_id`),
  CONSTRAINT `fk_lc_level` FOREIGN KEY (`level_id`) REFERENCES `level` (`level_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `level_command` VALUES 
(1,1),
(1,11),
(2,1),
(2,2),
(2,3),
(2,11),
(3,1),
(3,2),
(3,3),
(3,8),
(3,11),
(4,1),
(4,2),
(4,3),
(4,8),
(4,11),
(5,1),
(5,2),
(5,3),
(5,8),
(5,11),
(6,1),
(6,2),
(6,3),
(6,6),
(6,8),
(6,11),
(7,1),
(7,2),
(7,3),
(7,6),
(7,8),
(7,10),
(7,11),
(8,1),
(8,2),
(8,3),
(8,6),
(8,8),
(8,10),
(8,11),
(9,1),
(9,2),
(9,3),
(9,6),
(9,8),
(9,10),
(9,11),
(10,1),
(10,2),
(10,3),
(10,6),
(10,8),
(10,10),
(10,11),
(11,1),
(11,2),
(11,3),
(11,6),
(11,8),
(11,10),
(11,11),
(12,1),
(12,2),
(12,3),
(12,6),
(12,8),
(12,10),
(12,11),
(13,1),
(13,2),
(13,3),
(13,6),
(13,8),
(13,10),
(13,11),
(14,1),
(14,2),
(14,3),
(14,6),
(14,8),
(14,10),
(14,11),
(15,1),
(15,2),
(15,3),
(15,6),
(15,8),
(15,10),
(15,11),
(16,1),
(16,2),
(16,3),
(16,6),
(16,8),
(16,10),
(16,11),
(17,1),
(17,2),
(17,3),
(17,6),
(17,8),
(17,10),
(17,11),
(18,1),
(18,2),
(18,3),
(18,6),
(18,8),
(18,10),
(18,11),
(19,1),
(19,2),
(19,3),
(19,6),
(19,8),
(19,10),
(19,11),
(20,1),
(20,2),
(20,3),
(20,6),
(20,8),
(20,10),
(20,11);

DROP TABLE IF EXISTS `level_status`;
CREATE TABLE `level_status` (
  `level_status_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`level_status_id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `level_status` VALUES (1,'available'),(2,'blocked'),(3,'hidden');

DROP TABLE IF EXISTS `player_statistics`;
CREATE TABLE `player_statistics` (
  `user_id` int NOT NULL,
  `total_score` int NOT NULL DEFAULT '0',
  `levels_passed` int NOT NULL DEFAULT '0',
  `last_update` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_stats_user` FOREIGN KEY (`user_id`) REFERENCES `app_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `player_statistics` VALUES (1,0,0,'2026-10-26 10:00:00'),(2,0,0,'2026-10-05 09:11:00'),(3,0,0,'2026-10-05 09:11:00'),(4,0,0,'2026-10-26 10:00:00'),(5,0,0,'2026-10-26 10:00:00'),(6,0,0,'2026-10-26 10:00:00'),(7,0,0,'2026-10-26 10:00:00'),(8,0,0,'2026-10-26 10:00:00'),(9,0,0,'2026-10-26 10:00:00'),(10,0,0,'2026-10-26 10:00:00'),(11,0,0,'2026-10-26 10:00:00'),(12,0,0,'2026-10-26 10:00:00'),(13,0,0,'2026-10-26 10:00:00'),(14,0,0,'2026-10-26 10:00:00'),(15,0,0,'2026-10-26 10:00:00'),(16,0,0,'2026-10-26 10:00:00'),(17,0,0,'2026-10-26 10:00:00'),(18,0,0,'2026-10-26 10:00:00'),(19,0,0,'2026-10-26 10:00:00'),(20,0,0,'2026-10-26 10:00:00'),(21,0,0,'2026-10-26 10:00:00'),(22,0,0,'2026-10-26 10:00:00'),(23,0,0,'2026-10-26 10:00:00'),(24,0,0,'2026-10-26 10:00:00'),(25,0,0,'2026-10-26 10:00:00'),(26,0,0,'2026-10-26 10:00:00'),(27,0,0,'2026-10-26 10:00:00'),(28,0,0,'2026-10-26 10:00:00'),(29,0,0,'2026-10-26 10:00:00'),(30,0,0,'2026-10-26 10:00:00'),(31,0,0,'2026-10-26 10:00:00'),(32,0,0,'2026-10-26 10:00:00'),(33,0,0,'2026-10-26 10:00:00'),(34,0,0,'2026-10-26 10:00:00'),(35,0,0,'2026-10-26 10:00:00'),(36,0,0,'2026-10-26 10:00:00'),(37,0,0,'2026-10-26 10:00:00'),(38,0,0,'2026-10-26 10:00:00'),(39,0,0,'2026-10-26 10:00:00'),(40,0,0,'2026-10-26 10:00:00'),(41,0,0,'2026-10-26 10:00:00'),(42,0,0,'2026-10-26 10:00:00'),(43,0,0,'2026-10-26 10:00:00'),(44,0,0,'2026-10-26 10:00:00'),(45,0,0,'2026-10-26 10:00:00'),(46,0,0,'2026-10-26 10:00:00'),(47,0,0,'2026-10-26 10:00:00'),(48,0,0,'2026-10-26 10:00:00'),(49,0,0,'2026-10-26 10:00:00'),(50,0,0,'2026-10-26 10:00:00'),(51,0,0,'2026-10-26 10:00:00'),(52,0,0,'2026-10-26 10:00:00'),(53,0,0,'2026-10-26 10:00:00');

DROP TABLE IF EXISTS `refresh_token`;
CREATE TABLE `refresh_token` (
  `refresh_token_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `token_hash` char(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `expires_at` datetime NOT NULL,
  `revoked` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`refresh_token_id`),
  UNIQUE KEY `uq_refresh_token_hash` (`token_hash`),
  KEY `idx_refresh_user` (`user_id`),
  KEY `idx_refresh_expires` (`expires_at`),
  CONSTRAINT `fk_refresh_user` FOREIGN KEY (`user_id`) REFERENCES `app_user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `refresh_token` VALUES (1,4,'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90','2026-11-10 09:12:00',0),(2,5,'b2c3d4e5f6a718293a4b5c6d7e8f90a1b2c3d4e5f6a718293a4b5c6d7e8f90a1','2026-11-10 10:00:00',0),(3,12,'c3d4e5f6a7b819293a4b5c6d7e8f90a1b2c3d4e5f6a7b819293a4b5c6d7e8f90','2026-11-14 11:15:00',0),(4,20,'d4e5f6a7b8c919293a4b5c6d7e8f90a1b2c3d4e5f6a7b8c919293a4b5c6d7e8f','2026-11-22 15:20:00',0),(5,26,'e5f6a7b8c9da19293a4b5c6d7e8f90a1b2c3d4e5f6a7b8c9da19293a4b5c6d7e','2026-11-27 11:00:00',0),(6,28,'f6a7b8c9daeb19293a4b5c6d7e8f90a1b2c3d4e5f6a7b8c9daeb19293a4b5c6d','2026-11-29 16:10:00',0),(7,4,'a7b8c9daebfc19293a4b5c6d7e8f90a1b2c3d4e5f6a7b8c9daebfc19293a4b5c','2026-11-30 19:30:00',1),(8,6,'b8c9daebfc0d19293a4b5c6d7e8f90a1b2c3d4e5f6a7b8c9daebfc0d19293a4b','2026-12-06 10:00:00',0);

DROP TABLE IF EXISTS `result`;
CREATE TABLE `result` (
  `user_id` int NOT NULL,
  `level_id` int NOT NULL,
  `tick_count` int NOT NULL,
  `total_score` int NOT NULL DEFAULT '0',
  `fixed` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `attempt_id` int DEFAULT NULL,
  PRIMARY KEY (`user_id`,`level_id`),
  KEY `fk_result_level` (`level_id`),
  KEY `fk_result_attempt` (`attempt_id`),
  CONSTRAINT `fk_result_attempt` FOREIGN KEY (`attempt_id`) REFERENCES `attempt` (`attempt_id`),
  CONSTRAINT `fk_result_level` FOREIGN KEY (`level_id`) REFERENCES `level` (`level_id`),
  CONSTRAINT `fk_result_user` FOREIGN KEY (`user_id`) REFERENCES `app_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;