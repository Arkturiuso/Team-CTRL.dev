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
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `level` VALUES 
(1,'{"version":2,"level_name":"Лесная тропа","description":"Солнечная поляна на опушке леса. Собери ключ и дойди до выхода.","hint":"robot.move() делает один шаг вперёд. Вызови его шесть раз подряд. print(''текст'') выводит сообщение в консоль под кодом - удобно проверять, что происходит.","biome":"forest","width":7,"height":1,"entrance":"A1","entrance_direction":"right","exit":"G1","walls":[],"rocks":[],"coins":[{"id":1,"position":"B1"},{"id":2,"position":"C1"},{"id":3,"position":"D1"},{"id":4,"position":"F1"}],"keys":[{"id":1,"position":"E1"}],"required_key_position":"E1","enemies":[],"three_star_runs":3}',1,1,'2026-10-26 10:00:00'),
(2,'{"version":2,"level_name":"Первый поворот","description":"Тропа уходит вправо и поворачивает вниз. Научись разворачивать робота.","hint":"robot.turn_right() поворачивает направо, robot.turn_left() - налево. Поворот тоже тратит тик.","biome":"forest","width":5,"height":5,"entrance":"A1","entrance_direction":"right","exit":"E5","walls":[],"rocks":["B2","A3","C4","D3"],"coins":[{"id":1,"position":"B1"},{"id":2,"position":"D1"},{"id":3,"position":"E4"}],"keys":[{"id":1,"position":"C1"}],"required_key_position":"C1","enemies":[],"three_star_runs":3}',1,1,'2026-10-26 10:00:00'),
(3,'{"version":2,"level_name":"Лесной завал","description":"Деревья перекрыли путь. Проложи маршрут и повтори шаги циклом for.","hint":"for i in range(6): robot.move() - шесть шагов вправо. Затем robot.turn_right() и снова цикл, чтобы пройти вниз и влево.","biome":"forest","width":7,"height":7,"entrance":"A1","entrance_direction":"right","exit":"A7","walls":[],"rocks":["B3","C4","D2","E4","F3","B5"],"coins":[{"id":1,"position":"B1"},{"id":2,"position":"E1"},{"id":3,"position":"G3"},{"id":4,"position":"G6"},{"id":5,"position":"D7"}],"keys":[{"id":1,"position":"C1"}],"required_key_position":"C1","enemies":[],"three_star_runs":4}',2,1,'2026-10-26 10:00:00'),
(4,'{"version":2,"level_name":"Двойная петля","description":"Большая поляна. Повторяющиеся действия лучше поручить циклу for.","hint":"for i in range(7): robot.move() - семь шагов. Затем поворот и снова цикл.","biome":"forest","width":8,"height":8,"entrance":"A1","entrance_direction":"right","exit":"A8","walls":[],"rocks":["B3","C4","D5","E3","F5","G2","B6","D6"],"coins":[{"id":1,"position":"F1"},{"id":2,"position":"H4"},{"id":3,"position":"F8"},{"id":4,"position":"B8"}],"keys":[{"id":1,"position":"D1"}],"required_key_position":"D1","enemies":[],"three_star_runs":4}',2,1,'2026-10-26 10:00:00'),
(5,'{"version":2,"level_name":"Ледяной разлом","description":"Снежные пустоши. На льду робот скользит, пока не остановится у препятствия.","hint":"Лёд сам несёт робота вперёд. Разбей маршрут на короткие циклы for и не забывай поворачивать.","biome":"snow","width":7,"height":7,"entrance":"A1","entrance_direction":"right","exit":"G7","walls":[],"rocks":["B3","C4","D5","E3","F4","B5"],"coins":[{"id":1,"position":"B1"},{"id":2,"position":"E1"},{"id":3,"position":"G3"},{"id":4,"position":"G6"}],"keys":[{"id":1,"position":"C1"}],"required_key_position":"C1","enemies":[],"three_star_runs":4,"terrain":{"D1":"ice","E1":"ice","F1":"ice","G4":"ice","G5":"ice","G6":"ice"}}',2,1,'2026-10-26 10:00:00'),
(6,'{"version":2,"level_name":"Волчья тропа","description":"В снежном лесу не всё так пусто: на тропе дежурит волк. Враги видны на карте - подойди и атакуй.","hint":"Волк стоит на клетке I5. Встань перед ним и вызови robot.attack(), затем шагай дальше.","biome":"snow","width":9,"height":9,"entrance":"A1","entrance_direction":"right","exit":"I9","walls":[],"rocks":["C3","D4","E5","F6","G3","B6","D7"],"coins":[{"id":1,"position":"D1"},{"id":2,"position":"H1"},{"id":3,"position":"I3"},{"id":4,"position":"I7"}],"keys":[{"id":1,"position":"E1"}],"required_key_position":"E1","enemies":[{"id":1,"type":"wolf","position":"I5","patrol":["I5"],"move_every":3},{"id":2,"type":"snowman","position":"H6","patrol":["H6","H7"],"move_every":2}],"three_star_runs":5}',3,1,'2026-10-26 10:00:00'),
(7,'{"version":2,"level_name":"Пещера эха","description":"Подземный лабиринт. Здесь пригодится собственная функция: один раз описал - много раз вызвал.","hint":"Опиши def walk(n), которая делает n шагов, и вызывай её для каждой стороны зала.","biome":"cave","width":10,"height":10,"entrance":"A1","entrance_direction":"right","exit":"A10","walls":[],"rocks":["C4","D3","E5","F4","G6","H3","B5","D7","F7","H8"],"coins":[{"id":1,"position":"E1"},{"id":2,"position":"I1"},{"id":3,"position":"J5"},{"id":4,"position":"J9"},{"id":5,"position":"F10"},{"id":6,"position":"B10"}],"keys":[{"id":1,"position":"C1"}],"required_key_position":"C1","enemies":[{"id":1,"type":"golem","position":"E10","patrol":["E10"],"move_every":3}],"three_star_runs":5}',3,1,'2026-10-26 10:00:00'),
(8,'{"version":2,"level_name":"Пустыня забытых стен","description":"Раскалённые пески. Стены образуют длинный змеиный коридор, а скорпионы охраняют проходы.","hint":"Путь змеится: вправо, вниз, влево, вниз и снова вправо. Вынеси шаги с атакой в функцию.","biome":"desert","width":10,"height":10,"entrance":"A1","entrance_direction":"right","exit":"J10","walls":[],"rocks":["A3","B3","C3","D3","E3","F3","G3","H3","C8","D8","E8","F8","G8","H8","I8","J8","C9","D9","E9","F9","G9","H9","I9","J9"],"coins":[{"id":1,"position":"D1"},{"id":2,"position":"H1"},{"id":3,"position":"I4"},{"id":4,"position":"F6"},{"id":5,"position":"B8"},{"id":6,"position":"H10"}],"keys":[{"id":1,"position":"E1"}],"required_key_position":"E1","enemies":[{"id":1,"type":"scorpion","position":"F1","patrol":["F1"],"move_every":3},{"id":2,"type":"vulture","position":"I4","patrol":["I4","I5"],"move_every":2},{"id":3,"type":"golem","position":"E10","patrol":["E10"],"move_every":3}],"three_star_runs":6}',4,1,'2026-10-26 10:00:00'),
(9,'{"version":2,"level_name":"Гнилое болото","description":"Трясина замедляет робота. Обязательный ключ спрятан в глубине, а топь кишит слизнями.","hint":"Используй функции и циклы. Каждый шаг по грязи стоит дополнительный тик.","biome":"swamp","width":12,"height":12,"entrance":"A1","entrance_direction":"right","exit":"L12","walls":[],"rocks":["B4","C7","D9","E6","G3","H5","I8","J4","K7","C10","L1"],"coins":[{"id":1,"position":"B1"},{"id":2,"position":"D1"},{"id":3,"position":"I1"},{"id":4,"position":"K1"},{"id":5,"position":"K3"},{"id":6,"position":"F8"},{"id":7,"position":"F11"},{"id":8,"position":"H12"}],"keys":[{"id":1,"position":"F6"}],"required_key_position":"F6","enemies":[{"id":1,"type":"slime","position":"K5","patrol":["K5"],"move_every":3},{"id":2,"type":"slime","position":"F7","patrol":["F7"],"move_every":3},{"id":3,"type":"bat","position":"I12","patrol":["I12","J12"],"move_every":2}],"three_star_runs":6,"terrain":{"K2":"mud","K4":"mud","F9":"mud","H12":"mud"}}',4,1,'2026-10-26 10:00:00'),
(10,'{"version":2,"level_name":"Сердце вулкана","description":"Финальное испытание. Лавовые стражи, длинный обход и обязательный ключ в центре зала.","hint":"Собери ключ в центре, уничтожь стражей и доберись до выхода. Используй всё, чему научился.","biome":"volcano","width":12,"height":12,"entrance":"A1","entrance_direction":"right","exit":"L12","walls":[],"rocks":["B3","D3","G2","I4","C8","D8","G9","H9","B10","C10","F3","E6"],"coins":[{"id":1,"position":"C1"},{"id":2,"position":"I1"},{"id":3,"position":"K1"},{"id":4,"position":"K3"},{"id":5,"position":"F8"},{"id":6,"position":"F11"},{"id":7,"position":"H12"},{"id":8,"position":"J12"}],"keys":[{"id":1,"position":"G6"}],"required_key_position":"G6","enemies":[{"id":1,"type":"golem","position":"H6","patrol":["H6"],"move_every":3},{"id":2,"type":"golem","position":"F10","patrol":["F10"],"move_every":3},{"id":3,"type":"bat","position":"K12","patrol":["K12","L12"],"move_every":2}],"three_star_runs":6}',4,1,'2026-10-26 10:00:00');

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
(10,11);

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