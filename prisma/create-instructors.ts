/**
 * Create instructor accounts: first the User rows, then the linked Instructor rows.
 * Run with: npx tsx prisma/create-instructors.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PASSWORD = "Myengineeringexpert@1#";

const INSTRUCTORS = [
  {
    email: "dr.kamalverma83@gmail.com",
    name: "Dr Kamal Kant Verma",
    title: "Professor, School of CSE, IILM University",
    avatar: "https://lh3.googleusercontent.com/d/1ArJaRIj64fTFe15eaz9zVx8dDmY0PYU-=w400",
    bio: "Prof. (Dr.) Kamal Kant Verma is an accomplished academician, researcher, and administrator with over 20 years of experience in higher education and technical training. He is currently serving as Professor at the School of Computer Science and Engineering, IILM University, Greater Noida. He holds a Ph.D. in Computer Science & Engineering from Uttarakhand Technical University and Post-Doctoral Research at Kuala Lumpur University of Science and Technology (KLUST), Malaysia. His research focuses on Artificial Intelligence, Deep Learning, Machine Learning, Computer Vision, and Human Activity Recognition. Dr. Verma has published 55+ research papers, including SCI/SCIE and Scopus-indexed publications, and has authored academic books on Java Programming and e-Governance. He has held key academic leadership positions at COER University, Lovely Professional University, and VIT Bhopal University. He also serves as an editorial board member and reviewer for reputed international journals. His contributions to teaching, research, and academic administration reflect a strong commitment to innovation, excellence, and the advancement of computer science education.",
    qualifications: "Ph.D. (Computer Science & Engineering); Post-Doctoral Research at KLUST, Malaysia",
    experience: "20+ years",
    subjects: "C, C++, Python, Data Structures, Algorithms, Machine Learning, Deep Learning, Computer Organization",
  },
  {
    email: "anilyadav.rp@gmail.com",
    name: "Anil Kumar Yadav",
    title: "Electronics & Communication Engineering",
    avatar: "https://lh3.googleusercontent.com/d/1LaCK9DhCJYFpssZvhwQrHfyk1IWWP3Wt=w400",
    bio: "I am a Ph.D. Scholar in the Department of Electronics and Communication Engineering at Dr. B. R. Ambedkar National Institute of Technology (NIT) Jalandhar. I hold an M.Tech in Electronics and Communication Engineering. My research focuses on semiconductor devices, VLSI, nanoelectronics, and TCAD-based device modeling.",
    qualifications: "M.Tech (Electronics & Communication Engineering); Pursuing Ph.D. in ECE at NIT Jalandhar",
    experience: "5 years of teaching experience in ECE",
    subjects: "ECE, VLSI, Digital Electronics, Basic Electronics, Semiconductor Devices, Microprocessors & Embedded Systems",
  },
  {
    email: "aks.ajay11@gmail.com",
    name: "Ajay Kumar",
    title: "RF & Microwave Engineering",
    avatar: "https://lh3.googleusercontent.com/d/1Dt6HQlIqygmerkw_Q3chkD9SgCPkfkPF=w400",
    bio: "I am currently pursuing a Ph.D. in Electronics and Communication Engineering at Dr. B.R. Ambedkar National Institute of Technology (NIT) Jalandhar. I completed my B.Tech. in Electronics and Communication Engineering and my M.Tech. in Robotics from IIIT Allahabad. My research focuses on RF and Microwave Engineering, and I have published several conference papers and journal papers in the fields of Electronics and Communication Engineering. I am also the inventor of one patent. With a strong academic and research background, I am passionate about teaching and strive to make complex concepts simple, practical, and easy to understand, helping students build a strong foundation and achieve academic success.",
    qualifications: "Ph.D. (Pursuing) in ECE, NIT Jalandhar; M.Tech in Robotics, IIIT Allahabad",
    experience: "7+ years of teaching experience",
    subjects: "RF & Microwave Engineering, Antenna Design, Electromagnetic Simulation, Wireless Communication, ECE",
  },
  {
    email: "jaainharsh383@gmail.com",
    name: "Harsh Jain",
    title: "SDE & Competitive Programmer",
    avatar: "https://lh3.googleusercontent.com/d/1Lq4rseQZ7atWYOpdtCpJLs2AS5jvEGvd=w400",
    bio: "SDE developer with 2yr+ experience. NSUT passout, achieved 25K rank in JEE Mains 2021, Competitive Coder.",
    qualifications: "B.Tech (NSUT)",
    experience: "2+ years",
    subjects: "DSA, CS-related Subjects, Maths, Physics, Chemistry",
  },
  {
    email: "ajaysharmadharmani@gmail.com",
    name: "Ajay Sharma",
    title: "Data Science & ML Faculty",
    avatar: "https://lh3.googleusercontent.com/d/19iEwIB1wx1RfJb1K97pR9ReQGQiUJ3OG=w400",
    bio: "Ajay Sharma works as a Senior Technical Consultant (Data Science Faculty) at UpGrad and is currently deputed at Lovely Professional University, Jalandhar, Punjab India. Before joining UpGrad, Ajay worked for a short duration of time as an Assistant Professor in the Apex Institute of Technology in the Department of Computer Science at Chandigarh University. Ajay has worked as a Junior Research Fellow for ~2.5 years in the Department of Biotechnology and Bioinformatics at Jaypee University of Information Technology Solan Himachal Pradesh. He has obtained his master's degree in Computer Science Engineering, Specialization in Biomedical Image Processing, Deep Learning, and a bachelor's degree in Bioinformatics from Shoolini University. Mr. Ajay has completed his Computer Science Diploma from Lovely Professional University, Jalandhar, Punjab. During his bachelor's, he has got the certificate of merit / Gold Medal.",
    qualifications: "M.Tech CSE",
    experience: "6+ years of teaching experience",
    subjects: "Machine Learning, Deep Learning, Data Science, Python Programming, Data Structures and Algorithms",
  },
  {
    email: "ankitpro73@gmail.com",
    name: "Dr. Ankit Prajapati",
    title: "Engineering Mathematics",
    avatar: "https://lh3.googleusercontent.com/d/1E0TroTfT-mxqhssuA9OI7NwN_535A0_1=w400",
    bio: "Hi! I'm Ankit, a passionate Mathematics educator with experience teaching engineering students both offline and online. Since March 2024, I've been teaching one-to-one and group sessions on My Engineering Expert, helping students strengthen core concepts, improve problem-solving speed, and score higher in exams. I currently serve as a Faculty at the University of Lucknow, where I teach Mathematics to B.Tech students. My teaching focuses on clarity, visualization, and exam-oriented strategies—ensuring even the toughest topics feel simple and intuitive.",
    qualifications: "Ph.D.",
    experience: "7 years",
    subjects: "Engineering Mathematics",
  },
  {
    email: "harp433tkaur@gmail.com",
    name: "Harpreet Kaur",
    title: "Networking & Cyber Security",
    avatar: "https://lh3.googleusercontent.com/d/1Cxeuq0KBcd8WUMrF9x9wLcv_5PNIGf_f=w400",
    bio: "Harpreet Kaur is currently working as Cyber Security Analyst and Certified Ethical Hacker (CEH). She has almost 8.5 years of full-time working experience in teaching cybersecurity specific courses. In addition to it, she has an in-depth knowledge in several technologies such as Network Security & Cryptography, Intrusion Detection System, C-programming, Computer Architecture and Malware Analysis. Being an enthusiastic trainer, she always motivates her students to achieve their career goals.",
    qualifications: "M.Tech (Cyber Security); CEH",
    experience: "8.5 years",
    subjects: "Networking and Security",
  },
  {
    email: "amansaifi2008@gmail.com",
    name: "Aman Saifi",
    title: "AI & Computer Science",
    avatar: "https://lh3.googleusercontent.com/d/1EJS-oIy-ropb9Aitem-Q4cjRN8xmUIbm=w400",
    bio: "I am an M.Tech graduate in Artificial Intelligence & Computer Science and a GATE-qualified professional with over 2 years of teaching experience. I am passionate about Artificial Intelligence, Machine Learning, and Computer Science education, and I enjoy mentoring students while applying AI to solve real-world problems.",
    qualifications: "M.Tech in AI & Computer Science; GATE Qualified",
    experience: "2+ years",
    subjects: "Artificial Intelligence, Machine Learning, Deep Learning, Python Programming, Data Structures & Algorithms, Computer Science",
  },
];

async function main() {
  console.log("Creating instructor accounts…");
  const hashedPassword = await bcrypt.hash(PASSWORD, 10);

  for (const data of INSTRUCTORS) {
    // 1. Create (or update) the User account first
    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: {
        name: data.name,
        role: "instructor",
        avatar: data.avatar,
        password: hashedPassword,
        emailVerified: new Date(),
      },
      create: {
        email: data.email,
        name: data.name,
        role: "instructor",
        avatar: data.avatar,
        password: hashedPassword,
        emailVerified: new Date(),
      },
    });

    // 2. Then create the Instructor record linked to that user
    const instructor = await prisma.instructor.upsert({
      where: { userId: user.id },
      update: {
        name: data.name,
        title: data.title,
        avatar: data.avatar,
        bio: data.bio,
        qualifications: data.qualifications,
        experience: data.experience,
      },
      create: {
        userId: user.id,
        name: data.name,
        title: data.title,
        avatar: data.avatar,
        bio: data.bio,
        qualifications: data.qualifications,
        experience: data.experience,
      },
    });

    console.log(`✓ ${data.email} → user:${user.id.slice(0, 8)}… instructor:${instructor.id.slice(0, 8)}…`);
  }

  console.log(`\nDone. ${INSTRUCTORS.length} instructor accounts created. Password for all: ${PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
