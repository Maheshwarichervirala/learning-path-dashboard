USE learning_path_db;

INSERT INTO skills (id, name, domain, difficulty, prerequisite_skill_id) VALUES
(1,'HTML & CSS','Web Development',1,NULL),
(2,'JavaScript Basics','Web Development',2,1),
(3,'Git & GitHub','Web Development',1,NULL),
(4,'React','Web Development',3,2),
(5,'REST APIs','Web Development',3,2),
(6,'Python Basics','Data Science',1,NULL),
(7,'Statistics','Data Science',2,6),
(8,'Pandas','Data Science',2,6),
(9,'Machine Learning','Data Science',3,8);

INSERT INTO questions (skill_id, question_text, options, correct_index) VALUES
(1,'Which tag creates a hyperlink?','<a>|<link>|<href>|<url>',0),
(1,'Which CSS property changes text color?','font-color|color|text-style|foreground',1),
(1,'Which layout model is one-dimensional?','Grid|Flexbox|Float|Table',1),
(2,'Which keyword declares a block-scoped variable?','var|let|def|dim',1),
(2,'What does === check?','Value only|Type only|Value and type|Reference only',2),
(2,'Which method adds an item to the end of an array?','push|pop|shift|concat',0),
(6,'Which symbol starts a Python comment?','//|#|--|/*',1),
(6,'Which structure is immutable?','list|dict|tuple|set',2),
(6,'What does len([1,2,3]) return?','2|3|4|Error',1);

INSERT INTO resources (title, type, url, skill_id, source, rating, tags) VALUES
('MDN: Learn Web Development','ARTICLE','https://developer.mozilla.org/en-US/docs/Learn_web_development',1,'MDN',4.8,'html css web'),
('The Modern JavaScript Tutorial','ARTICLE','https://javascript.info',2,'javascript.info',4.9,'javascript basics'),
('Pro Git Book','BOOK','https://git-scm.com/book/en/v2',3,'git-scm',4.7,'git github'),
('React: Learn','ARTICLE','https://react.dev/learn',4,'react.dev',4.8,'react components hooks'),
('Python Official Tutorial','ARTICLE','https://docs.python.org/3/tutorial/',6,'python.org',4.6,'python basics'),
('pandas: Getting Started','ARTICLE','https://pandas.pydata.org/docs/getting_started/index.html',8,'pandas',4.5,'pandas dataframes');

INSERT INTO badges (code, name, description) VALUES
('FIRST_STEP','First Step','Completed your first resource'),
('STREAK_3','On a Roll','Learned 3 days in a row'),
('CENTURY','Century Club','Earned 100 points'),
('ACE','Quiz Ace','Scored 90% or more on an assessment');