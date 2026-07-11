--
-- PostgreSQL database dump
--

\restrict XrhjQeHNsdNa9LnkJX6vU0Z4eceiNrBbAZrGyzwFyI70hBcppdnXZhhyRfVszUA

-- Dumped from database version 14.19 (Homebrew)
-- Dumped by pg_dump version 14.19 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: Level; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Level" AS ENUM (
    'Beginner',
    'Intermediate',
    'Advanced'
);


ALTER TYPE public."Level" OWNER TO postgres;

--
-- Name: LiveStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."LiveStatus" AS ENUM (
    'Upcoming',
    'Live',
    'Ongoing',
    'Completed'
);


ALTER TYPE public."LiveStatus" OWNER TO postgres;

--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'Success',
    'Failed',
    'Pending'
);


ALTER TYPE public."OrderStatus" OWNER TO postgres;

--
-- Name: Plan; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Plan" AS ENUM (
    'free',
    'premium'
);


ALTER TYPE public."Plan" OWNER TO postgres;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Role" AS ENUM (
    'student',
    'instructor',
    'admin'
);


ALTER TYPE public."Role" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Announcement; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Announcement" (
    id text NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    tone text DEFAULT 'info'::text NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Announcement" OWNER TO postgres;

--
-- Name: Course; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Course" (
    id text NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    category text NOT NULL,
    level public."Level" DEFAULT 'Beginner'::public."Level" NOT NULL,
    price integer NOT NULL,
    "originalPrice" integer NOT NULL,
    rating double precision DEFAULT 0 NOT NULL,
    "ratingCount" integer DEFAULT 0 NOT NULL,
    "durationHours" integer DEFAULT 0 NOT NULL,
    lectures integer DEFAULT 0 NOT NULL,
    language text DEFAULT 'English'::text NOT NULL,
    thumbnail text,
    badge text,
    tags text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "instructorId" text NOT NULL,
    program text DEFAULT 'btech-bca'::text NOT NULL,
    "plannerUrl" text,
    popular boolean DEFAULT false NOT NULL
);


ALTER TABLE public."Course" OWNER TO postgres;

--
-- Name: EmailVerificationToken; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."EmailVerificationToken" (
    id text NOT NULL,
    token text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "userId" text NOT NULL
);


ALTER TABLE public."EmailVerificationToken" OWNER TO postgres;

--
-- Name: Enrollment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Enrollment" (
    id text NOT NULL,
    progress integer DEFAULT 0 NOT NULL,
    "lastAccessed" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "userId" text NOT NULL,
    "courseId" text NOT NULL
);


ALTER TABLE public."Enrollment" OWNER TO postgres;

--
-- Name: Instructor; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Instructor" (
    id text NOT NULL,
    name text NOT NULL,
    title text NOT NULL,
    avatar text,
    rating double precision DEFAULT 0 NOT NULL,
    students integer DEFAULT 0 NOT NULL,
    bio text,
    experience text,
    qualifications text,
    "userId" text
);


ALTER TABLE public."Instructor" OWNER TO postgres;

--
-- Name: Lesson; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Lesson" (
    id text NOT NULL,
    title text NOT NULL,
    "order" integer NOT NULL,
    "courseId" text NOT NULL
);


ALTER TABLE public."Lesson" OWNER TO postgres;

--
-- Name: LessonProgress; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."LessonProgress" (
    id text NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "userId" text NOT NULL,
    "lessonId" text NOT NULL
);


ALTER TABLE public."LessonProgress" OWNER TO postgres;

--
-- Name: LiveClass; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."LiveClass" (
    id text NOT NULL,
    title text NOT NULL,
    topic text NOT NULL,
    subject text,
    "meetingUrl" text,
    "startsAt" timestamp(3) without time zone NOT NULL,
    "endsAt" timestamp(3) without time zone NOT NULL,
    status public."LiveStatus" DEFAULT 'Upcoming'::public."LiveStatus" NOT NULL,
    "instructorId" text NOT NULL,
    "courseId" text
);


ALTER TABLE public."LiveClass" OWNER TO postgres;

--
-- Name: Order; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Order" (
    id text NOT NULL,
    amount integer NOT NULL,
    status public."OrderStatus" DEFAULT 'Pending'::public."OrderStatus" NOT NULL,
    course text NOT NULL,
    "courseId" text,
    "planName" text,
    "razorpayOrderId" text,
    "razorpayPaymentId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "userId" text NOT NULL
);


ALTER TABLE public."Order" OWNER TO postgres;

--
-- Name: Otp; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Otp" (
    id text NOT NULL,
    phone text NOT NULL,
    code text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Otp" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    name text DEFAULT 'Student'::text NOT NULL,
    email text,
    avatar text,
    role public."Role" DEFAULT 'student'::public."Role" NOT NULL,
    plan public."Plan" DEFAULT 'free'::public."Plan" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    password text,
    phone text,
    "emailVerified" timestamp(3) without time zone,
    "isDisabled" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: Wishlist; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Wishlist" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "courseId" text NOT NULL
);


ALTER TABLE public."Wishlist" OWNER TO postgres;

--
-- Data for Name: Announcement; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Announcement" (id, title, body, tone, date) FROM stdin;
a357ea81-e0a8-44e4-a0d5-bfdb8b591937	New Semester Courses Launched	We just launched 12 new semester courses. Explore them now.	info	2026-05-06 00:00:00
da6292f5-958c-46e7-b611-119c2a9ef5c4	Exam-Time Offer — 40% OFF	Get up to 40% off on all courses for a limited time.	offer	2026-05-05 00:00:00
7b176f08-e6f4-4f16-9001-b41895f3a936	Live Class Schedule Updated	Check out the updated live-class timetable for this week.	schedule	2026-05-05 00:00:00
\.


--
-- Data for Name: Course; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Course" (id, slug, title, category, level, price, "originalPrice", rating, "ratingCount", "durationHours", lectures, language, thumbnail, badge, tags, "createdAt", "instructorId", program, "plannerUrl", popular) FROM stdin;
5121faf3-c77b-4c1f-8b1b-7958e4d48fb6	data-structures-using-cpp	Data Structures Using C++	Computer Science	Beginner	1499	2499	4.6	320	12	42	English	https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=60	Bestseller	{C++,DSA,"Problem Solving"}	2026-06-19 06:39:05.73	92e9e8cc-ada3-43dd-a199-07ab70a41aae	btech-bca	/planners/dsa-cpp-planner.pdf	t
16207452-62e2-413c-bfee-5ef0a56f3f1f	database-management-systems	Database Management Systems	Computer Science	Intermediate	999	1999	4.7	410	15	50	English	https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=800&q=60	50% OFF	{SQL,Normalization,Transactions}	2026-06-19 06:39:05.734	a50ca032-6638-4195-b5bb-610474247881	btech-bca	/planners/dbms-planner.pdf	t
5adbb257-6a12-479b-b618-2d424bd0f310	operating-systems	Operating Systems	Computer Science	Intermediate	1299	2199	4.8	512	14	46	English	https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=800&q=60	\N	{Processes,Scheduling,Memory}	2026-06-19 06:39:05.735	b7dcd708-183a-40a1-801f-47e6abcb5ddb	btech-bca	/planners/os-planner.pdf	t
def9d907-2ce2-42fb-941c-8c7e04011d63	computer-networks	Computer Networks	Computer Science	Beginner	1199	1999	4.6	298	8	36	English	https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=60	\N	{TCP/IP,OSI,Routing}	2026-06-19 06:39:05.736	07ca4625-859e-4d31-956d-10d2a8c9c53a	btech-bca	/planners/networks-planner.pdf	f
1bfd3f30-bdb1-4509-9011-dbdf97350e22	engineering-mathematics-ii	Engineering Mathematics II	Computer Science	Beginner	799	1499	4.5	256	10	38	Hindi	https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=60	\N	{Calculus,"Linear Algebra"}	2026-06-19 06:39:05.737	08b7ba7d-ea90-45f4-8023-16b270b2ff78	btech-bca	/planners/maths-planner.pdf	f
3765c333-1889-40f7-9596-6e3cb09eb421	object-oriented-programming-java	Object Oriented Programming in Java	Information Technology	Intermediate	1299	2299	4.6	344	13	44	English	https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=800&q=60	New	{Java,OOP,Design}	2026-06-19 06:39:05.738	92e9e8cc-ada3-43dd-a199-07ab70a41aae	btech-bca	/planners/java-planner.pdf	t
cac04454-a2de-4765-9b3a-cdab8e676a1b	digital-electronics	Digital Electronics	Electronics	Beginner	999	1999	4.7	401	11	40	English	https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=800&q=60	50% OFF	{"Logic Gates",Flip-Flops}	2026-06-19 06:39:05.739	b7dcd708-183a-40a1-801f-47e6abcb5ddb	btech-bca	/planners/digital-electronics-planner.pdf	f
f2fa82a9-c739-433e-af4e-802030c1ed57	software-engineering	Software Engineering	Information Technology	Intermediate	1199	1999	4.8	298	12	41	English	https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=60	\N	{SDLC,Agile,Testing}	2026-06-19 06:39:05.739	08b7ba7d-ea90-45f4-8023-16b270b2ff78	btech-bca	/planners/software-engineering-planner.pdf	t
36972d58-9721-48db-a7ab-65c0b7f21498	computer-organization-architecture	Computer Organization & Architecture	Computer Science	Intermediate	1399	2299	4.7	180	16	52	English	https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=60	\N	{CPU,"Memory Hierarchy",I/O}	2026-06-19 06:39:05.74	b7dcd708-183a-40a1-801f-47e6abcb5ddb	btech-bca	/planners/coa-planner.pdf	t
5144a61d-8cfe-4e85-a597-231502232c58	theory-of-computation	Theory of Computation	Computer Science	Advanced	1099	1899	4.9	120	18	48	English	https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=60	\N	{Automata,"Context Free Grammar","Turing Machines"}	2026-06-19 06:39:05.74	08b7ba7d-ea90-45f4-8023-16b270b2ff78	btech-bca	/planners/toc-planner.pdf	t
5a37dc52-0bb3-4861-b7df-7ba5812e6e7c	compiler-design	Compiler Design	Computer Science	Advanced	1199	1999	4.6	95	14	44	English	https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=60	\N	{"Lexical Analysis",Parsing,"Code Generation"}	2026-06-19 06:39:05.741	b7dcd708-183a-40a1-801f-47e6abcb5ddb	btech-bca	/planners/compiler-planner.pdf	f
3f0619a0-8e61-4eb5-a4e9-85b353fdca6d	discrete-mathematics	Discrete Mathematics	Computer Science	Intermediate	899	1599	4.7	155	12	40	Hindi	https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=60	\N	{"Set Theory","Graph Theory",Logic}	2026-06-19 06:39:05.741	08b7ba7d-ea90-45f4-8023-16b270b2ff78	btech-bca	/planners/discrete-maths-planner.pdf	f
890631bd-8e33-4c28-88db-5547e8f3054f	microprocessors-microcontrollers	Microprocessors & Microcontrollers	Electronics	Intermediate	1299	2199	4.6	110	15	45	English	https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=60	\N	{8085,8086,"Embedded Systems"}	2026-06-19 06:39:05.742	b7dcd708-183a-40a1-801f-47e6abcb5ddb	btech-bca	/planners/micro-planner.pdf	f
1415d5d6-976a-4ace-bc9f-1852baf80345	artificial-intelligence	Artificial Intelligence	Computer Science	Intermediate	1599	2699	4.8	210	16	48	English	https://images.unsplash.com/photo-1555255707-c079664889ec?auto=format&fit=crop&w=800&q=60	\N	{"Search Algorithms","Neural Networks",NLP}	2026-06-19 06:39:05.743	d495a954-b661-48ea-a507-78cd2fa63ad2	btech-bca	/planners/ai-planner.pdf	f
\.


--
-- Data for Name: EmailVerificationToken; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."EmailVerificationToken" (id, token, "expiresAt", "createdAt", "userId") FROM stdin;
c7e3d7a2-65d0-41fe-8d80-fffb24d1f710	3a9af072de358f242cf22edd17246fd480ec7c3224fd0f0c59333121a2581af3	2026-07-07 13:07:11.141	2026-07-06 13:07:11.142	fce52d86-5155-46a2-a9bd-a3994ae936d1
a5e793e4-b3c1-4cbe-aea8-08c40d6119e6	43a90b3df3d8e9777896b8f6be7e0ae88ac88faa8db5fda7e2e9f47f920ae124	2026-07-07 13:11:07.761	2026-07-06 13:11:07.762	3ce52d86-5155-46a2-a9bd-a3994ae936db
82294163-b222-49ea-9016-5de0d1b3c121	511329584738d2f6f699a98df29fc3dbf6dcac927bc16bcb2db608d94dfc1f07	2026-07-12 12:24:27.804	2026-07-11 12:24:27.805	68c84614-95af-4b4a-b575-7e66dbfa3ce4
\.


--
-- Data for Name: Enrollment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Enrollment" (id, progress, "lastAccessed", "userId", "courseId") FROM stdin;
e43e0ce1-e04b-452f-be13-497c3ef0d8bf	91	2026-06-19 06:39:05.745	203bad8f-d811-40eb-83eb-b01cae14a9e1	5121faf3-c77b-4c1f-8b1b-7958e4d48fb6
1fe22bec-f0e7-4bac-8dd4-7c8d752a31b9	30	2026-06-19 06:39:05.747	203bad8f-d811-40eb-83eb-b01cae14a9e1	16207452-62e2-413c-bfee-5ef0a56f3f1f
886bd72b-6a2b-43e4-ac8b-73d8c75df144	97	2026-06-19 06:39:05.747	203bad8f-d811-40eb-83eb-b01cae14a9e1	5adbb257-6a12-479b-b618-2d424bd0f310
405af6bb-1d91-4c17-9108-1fbf72092dcb	0	2026-06-19 07:32:21.742	fce52d86-5155-46a2-a9bd-a3994ae936db	5121faf3-c77b-4c1f-8b1b-7958e4d48fb6
7c23ae00-bc81-4990-b19a-dc4cb0b69545	0	2026-06-24 05:59:35.518	3ce52d86-5155-46a2-a9bd-a3994ae936db	5121faf3-c77b-4c1f-8b1b-7958e4d48fb6
\.


--
-- Data for Name: Instructor; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Instructor" (id, name, title, avatar, rating, students, bio, experience, qualifications, "userId") FROM stdin;
a50ca032-6638-4195-b5bb-610474247881	Prof. Neha Singh	Database Systems	https://i.pravatar.cc/120?img=45	4.7	31980	\N	\N	\N	\N
b7dcd708-183a-40a1-801f-47e6abcb5ddb	Prof. Ankit Verma	Operating Systems	https://i.pravatar.cc/120?img=33	4.8	27410	\N	\N	\N	\N
07ca4625-859e-4d31-956d-10d2a8c9c53a	Prof. Karan Shah	Computer Networks	https://i.pravatar.cc/120?img=51	4.6	19850	\N	\N	\N	\N
08b7ba7d-ea90-45f4-8023-16b270b2ff78	Prof. Pooja Patel	Engineering Mathematics	https://i.pravatar.cc/120?img=47	4.7	22300	\N	\N	\N	\N
d495a954-b661-48ea-a507-78cd2fa63ad2	Harsh Jain	sde	https://i.pravatar.cc/160?u=jaainharsh383%40gmail.com	0	0	dfdff			fce52d86-5155-46a2-a9bd-a3994ae936db
92e9e8cc-ada3-43dd-a199-07ab70a41aae	Prof. Rohit Sharma	Data Structures & Algorithms	https://i.pravatar.cc/120?img=15	4.8	48230	Hi my name is rohit sharma phd graduate acheived 25K rank in Hi my name is rohit sharma phd graduate acheived 25K rank in jeeHi my name is rohit sharma phd graduate acheived 25K rank in jeeHi my name is rohit sharma phd graduate acheived 25K rank in jeeHi my name is rohit sharma phd graduate acheived 25K rank in jeeHi my name is rohit sharma phd graduate acheived 25K rank in jeeHi my name is rohit sharma phd graduate acheived 25K rank in jeeHi my name is rohit sharma phd graduate acheived 25K rank in jeeHi my name is rohit sharma phd graduate acheived 25K rank in jeeHi my name is rohit sharma phd graduate acheived 25K rank in jeeHi my name is rohit sharma phd graduate acheived 25K rank in jeeHi my name is rohit sharma phd graduate acheived 25K rank in jeeHi my name is rohit sharma phd graduate acheived 25K rank in jeeHi my name is rohit sharma phd graduate acheived 25K rank in jee\r\n\r\nhttps://www.linkedin.com/in/harsh-jain-1711a3279/			3ce52d86-5155-46a2-a9bd-a3994ae936db
\.


--
-- Data for Name: Lesson; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Lesson" (id, title, "order", "courseId") FROM stdin;
\.


--
-- Data for Name: LessonProgress; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."LessonProgress" (id, completed, "completedAt", "userId", "lessonId") FROM stdin;
\.


--
-- Data for Name: LiveClass; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."LiveClass" (id, title, topic, subject, "meetingUrl", "startsAt", "endsAt", status, "instructorId", "courseId") FROM stdin;
82d81a21-4bae-485d-a532-232a29769e0a	Data Structures & Algorithms	Arrays and Linked Lists	\N	\N	2026-06-03 15:30:00	2026-06-03 17:00:00	Upcoming	92e9e8cc-ada3-43dd-a199-07ab70a41aae	5121faf3-c77b-4c1f-8b1b-7958e4d48fb6
89812011-8534-4b67-a359-b569add16fd0	Operating Systems	Process Scheduling	\N	\N	2026-06-03 13:30:00	2026-06-03 15:00:00	Live	b7dcd708-183a-40a1-801f-47e6abcb5ddb	5adbb257-6a12-479b-b618-2d424bd0f310
0f8aeaf8-457f-46c1-bf2d-b59c1d60723f	Database Management Systems	Normalization in DBMS	\N	\N	2026-06-04 12:30:00	2026-06-04 14:00:00	Upcoming	a50ca032-6638-4195-b5bb-610474247881	16207452-62e2-413c-bfee-5ef0a56f3f1f
bb4ed684-6e14-4caa-83e1-135f9b8f88de	Computer Networks	TCP/IP Model	\N	\N	2026-06-05 14:00:00	2026-06-05 15:30:00	Upcoming	07ca4625-859e-4d31-956d-10d2a8c9c53a	\N
49759362-ca1a-4bc2-a267-0bc231812403	Engineering Mathematics	Linear Algebra & Matrices	\N	\N	2026-06-06 10:00:00	2026-06-06 11:30:00	Upcoming	08b7ba7d-ea90-45f4-8023-16b270b2ff78	\N
6d77ca7c-ba46-4324-8ab2-dbed39cc8011	Software Engineering	Agile Methodologies	\N	\N	2026-06-06 16:00:00	2026-06-06 17:30:00	Upcoming	08b7ba7d-ea90-45f4-8023-16b270b2ff78	\N
3973f63a-d8f3-481e-907f-e715712a4b1e	Computer Organization	Pipelining & Hazards	\N	\N	2026-06-07 11:00:00	2026-06-07 12:30:00	Upcoming	b7dcd708-183a-40a1-801f-47e6abcb5ddb	\N
\.


--
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Order" (id, amount, status, course, "courseId", "planName", "razorpayOrderId", "razorpayPaymentId", "createdAt", "userId") FROM stdin;
8e81045a-b058-4792-b3c7-1f79f93c6b87	1499	Success	Data Structures Using C++	\N	\N	\N	\N	2026-05-06 00:00:00	203bad8f-d811-40eb-83eb-b01cae14a9e1
aa288a5c-ce72-4fb2-a08c-affe6b89cd22	999	Success	DBMS Complete Course	\N	\N	\N	\N	2026-05-05 00:00:00	203bad8f-d811-40eb-83eb-b01cae14a9e1
8f52edd6-b4f3-4024-891e-3b3c9c3f3467	1299	Success	Operating Systems	\N	\N	\N	\N	2026-04-29 00:00:00	203bad8f-d811-40eb-83eb-b01cae14a9e1
0eae6c9a-27bc-4291-94bb-cb459722eba8	1199	Failed	Computer Networks	\N	\N	\N	\N	2026-04-25 00:00:00	203bad8f-d811-40eb-83eb-b01cae14a9e1
2925dc71-5108-4016-a0e5-30bbf2aef449	799	Success	Engineering Mathematics II	\N	\N	\N	\N	2026-04-20 00:00:00	203bad8f-d811-40eb-83eb-b01cae14a9e1
98c45f39-92cc-487a-9f0c-23e735003cf3	1499	Success	Data Structures Using C++	5121faf3-c77b-4c1f-8b1b-7958e4d48fb6	Batch	dummy_1781854341734	pay_dummy_1781854341734	2026-06-19 07:32:21.735	fce52d86-5155-46a2-a9bd-a3994ae936db
804cdcf6-1e39-4309-8e7f-30a936923151	1499	Success	Data Structures Using C++	5121faf3-c77b-4c1f-8b1b-7958e4d48fb6	Batch	dummy_1782280775504	pay_dummy_1782280775504	2026-06-24 05:59:35.505	3ce52d86-5155-46a2-a9bd-a3994ae936db
76a1469b-87eb-435b-a1e7-f564bcf28e7c	1499	Success	Data Structures Using C++	5121faf3-c77b-4c1f-8b1b-7958e4d48fb6	Batch	dummy_1782322291408	pay_dummy_1782322291408	2026-06-24 17:31:31.409	fce52d86-5155-46a2-a9bd-a3994ae936db
\.


--
-- Data for Name: Otp; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Otp" (id, phone, code, "expiresAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, name, email, avatar, role, plan, "createdAt", "updatedAt", password, phone, "emailVerified", "isDisabled") FROM stdin;
fce52d86-5155-46a2-a9bd-a3994ae936d1	Harsh	jaainharsh385@gmail.com	\N	admin	free	2026-06-19 07:32:03.792	2026-06-19 07:32:03.792	$2b$10$zDcMGF/nvkarfjye01DJiOvIb2S.UIY5/NnD8rK.rcBsDgCamhY52	\N	\N	f
203bad8f-d811-40eb-83eb-b01cae14a9e1	Aditya Kumar	aditya.kumar@email.com	https://i.pravatar.cc/160?img=12	student	free	2026-06-19 06:39:05.743	2026-07-06 13:09:59.016	$2b$10$UE9vN5DTe66BD9F0aqYMtuyILnzUt9TrlpuKf884VyyHoXa1mXaMG	\N	\N	f
3ce52d86-5155-46a2-a9bd-a3994ae936db	Prof. Rohit Sharma	jaainharsh384@gmail.com	\N	instructor	free	2026-06-19 07:32:03.792	2026-07-06 13:10:39.74	$2b$10$zDcMGF/nvkarfjye01DJiOvIb2S.UIY5/NnD8rK.rcBsDgCamhY52	\N	\N	t
fce52d86-5155-46a2-a9bd-a3994ae936db	Harsh Jain	jaainharsh383@gmail.com	\N	admin	free	2026-06-19 07:32:03.792	2026-06-28 11:48:30.111	$2b$10$zDcMGF/nvkarfjye01DJiOvIb2S.UIY5/NnD8rK.rcBsDgCamhY52	\N	2026-06-28 11:48:30.109	f
68c84614-95af-4b4a-b575-7e66dbfa3ce4	test	harsh.jain.ug21@nsut.ac.in	\N	student	free	2026-07-11 12:24:27.79	2026-07-11 12:24:27.79	$2b$10$XbBiV4j8zZFNlolb5/Yb1eSopPGPS9A5759SG/br7m9oYMNT8NCkG	\N	\N	f
\.


--
-- Data for Name: Wishlist; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Wishlist" (id, "userId", "courseId") FROM stdin;
\.


--
-- Name: Announcement Announcement_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Announcement"
    ADD CONSTRAINT "Announcement_pkey" PRIMARY KEY (id);


--
-- Name: Course Course_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Course"
    ADD CONSTRAINT "Course_pkey" PRIMARY KEY (id);


--
-- Name: EmailVerificationToken EmailVerificationToken_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EmailVerificationToken"
    ADD CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY (id);


--
-- Name: Enrollment Enrollment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Enrollment"
    ADD CONSTRAINT "Enrollment_pkey" PRIMARY KEY (id);


--
-- Name: Instructor Instructor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Instructor"
    ADD CONSTRAINT "Instructor_pkey" PRIMARY KEY (id);


--
-- Name: LessonProgress LessonProgress_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LessonProgress"
    ADD CONSTRAINT "LessonProgress_pkey" PRIMARY KEY (id);


--
-- Name: Lesson Lesson_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Lesson"
    ADD CONSTRAINT "Lesson_pkey" PRIMARY KEY (id);


--
-- Name: LiveClass LiveClass_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LiveClass"
    ADD CONSTRAINT "LiveClass_pkey" PRIMARY KEY (id);


--
-- Name: Order Order_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY (id);


--
-- Name: Otp Otp_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Otp"
    ADD CONSTRAINT "Otp_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Wishlist Wishlist_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Wishlist"
    ADD CONSTRAINT "Wishlist_pkey" PRIMARY KEY (id);


--
-- Name: Course_category_level_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Course_category_level_idx" ON public."Course" USING btree (category, level);


--
-- Name: Course_program_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Course_program_idx" ON public."Course" USING btree (program);


--
-- Name: Course_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Course_slug_key" ON public."Course" USING btree (slug);


--
-- Name: EmailVerificationToken_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "EmailVerificationToken_token_key" ON public."EmailVerificationToken" USING btree (token);


--
-- Name: EmailVerificationToken_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "EmailVerificationToken_userId_idx" ON public."EmailVerificationToken" USING btree ("userId");


--
-- Name: Enrollment_userId_courseId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Enrollment_userId_courseId_key" ON public."Enrollment" USING btree ("userId", "courseId");


--
-- Name: Instructor_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Instructor_userId_key" ON public."Instructor" USING btree ("userId");


--
-- Name: LessonProgress_userId_lessonId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "LessonProgress_userId_lessonId_key" ON public."LessonProgress" USING btree ("userId", "lessonId");


--
-- Name: Order_razorpayOrderId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Order_razorpayOrderId_key" ON public."Order" USING btree ("razorpayOrderId");


--
-- Name: Otp_phone_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Otp_phone_idx" ON public."Otp" USING btree (phone);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_phone_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_phone_key" ON public."User" USING btree (phone);


--
-- Name: Wishlist_userId_courseId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Wishlist_userId_courseId_key" ON public."Wishlist" USING btree ("userId", "courseId");


--
-- Name: Course Course_instructorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Course"
    ADD CONSTRAINT "Course_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES public."Instructor"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: EmailVerificationToken EmailVerificationToken_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EmailVerificationToken"
    ADD CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Enrollment Enrollment_courseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Enrollment"
    ADD CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES public."Course"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Enrollment Enrollment_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Enrollment"
    ADD CONSTRAINT "Enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Instructor Instructor_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Instructor"
    ADD CONSTRAINT "Instructor_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: LessonProgress LessonProgress_lessonId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LessonProgress"
    ADD CONSTRAINT "LessonProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES public."Lesson"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LessonProgress LessonProgress_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LessonProgress"
    ADD CONSTRAINT "LessonProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Lesson Lesson_courseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Lesson"
    ADD CONSTRAINT "Lesson_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES public."Course"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LiveClass LiveClass_courseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LiveClass"
    ADD CONSTRAINT "LiveClass_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES public."Course"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: LiveClass LiveClass_instructorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LiveClass"
    ADD CONSTRAINT "LiveClass_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES public."Instructor"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Order Order_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Wishlist Wishlist_courseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Wishlist"
    ADD CONSTRAINT "Wishlist_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES public."Course"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Wishlist Wishlist_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Wishlist"
    ADD CONSTRAINT "Wishlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict XrhjQeHNsdNa9LnkJX6vU0Z4eceiNrBbAZrGyzwFyI70hBcppdnXZhhyRfVszUA

