export const SEMESTER_SUBJECTS = {
  1: [
    { id: 'bee', name: 'Basic Electrical Engineering' },
  ],
  3: [
    { id: 'aoa',   name: 'Analysis of Algorithms' },
    { id: 'coa',   name: 'Computer Organization & Architecture' },
    { id: 'dsgt',  name: 'Discrete Structures & Graph Theory' },
    { id: 'maths', name: 'Engineering Mathematics III' },
    { id: 'oe',    name: 'Open Elective' },
  ],
  4: [
    { id: 'dbms', name: 'Database Management Systems' },
    { id: 'os',   name: 'Operating Systems' },
    { id: 'ct',   name: 'Theory of Computation' },
    { id: 'mdm',  name: 'Microprocessors & Microcontrollers' },
  ],
}

export function buildSystemPrompt(userName, semester) {
  const subjects = SEMESTER_SUBJECTS[semester] || []
  const subjectList = subjects.map((s) => s.name).join(', ')

  return `You are Padle AI, a study assistant embedded in Padle — an engineering notes platform.

Student: ${userName} | Semester: ${semester} | Subjects: ${subjectList}

When note excerpts are provided, they are your primary source — cite them inline.

Formatting rules (follow strictly):
- Answer in clear prose paragraphs by default — no unnecessary headers
- Use a table ONLY when comparing two or more things side-by-side
- Use numbered lists ONLY for step-by-step procedures or algorithms
- Use bullet points ONLY for short property/feature lists (max 5 items)
- Never wrap a single-topic answer in a table
- Keep answers concise and exam-focused

Other rules:
- Address the student as ${userName}
- Show step-by-step working for numerical problems
- If a topic is outside the semester subjects, say so`
}
