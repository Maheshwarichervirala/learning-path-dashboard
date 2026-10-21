USE learning_path_db;

INSERT INTO badges (code, name, description) VALUES
('QUIZ_MASTER', 'Quiz Master', 'Completed at least 5 assessments'),
('POLYGLOT', 'Polyglot', 'Practiced skills across 3 different domains'),
('STREAK_7', '7-Day Streak', 'Maintained a 7-day learning streak'),
('HIGH_ROLLER', '500 Points', 'Earned 500 points on your learning journey'),
('PATH_FINISHER', 'Path Finisher', 'Completed all steps in your learning path'),
('RESOURCE_CHAMP', 'Resource Explorer', 'Completed 10 learning resources'),
('PERFECT_SCORE', 'Perfect Score', 'Achieved a perfect 100% on a quiz'),
('FAST_LEARNER', 'Fast Learner', 'Earned 250 points on your profile')
ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description);
