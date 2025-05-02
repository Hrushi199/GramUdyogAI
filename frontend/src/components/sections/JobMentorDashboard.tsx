import { useEffect, useState } from 'react'

export default function JobMentorDashboard() {
  const [jobs, setJobs] = useState([])
  const [mentors, setMentors] = useState([])
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/match/jobs`).then(res => res.json()).then(setJobs)
    fetch(`${API_BASE_URL}/api/match/mentors`).then(res => res.json()).then(setMentors)
  }, [])

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-xl font-bold">🔍 Matched Jobs</h2>
      {jobs.map((job: any) => (
        <div key={job.id} className="border p-2 my-2 rounded">{job.title} @ {job.org}</div>
      ))}

      <h2 className="text-xl font-bold mt-6">🤝 Mentorship Opportunities</h2>
      {mentors.map((m: any) => (
        <div key={m.id} className="border p-2 my-2 rounded">
          {m.name} - Skills: {m.skills.join(', ')}
          <a href={m.discourseProfile} className="text-blue-600 ml-2" target="_blank">Message on Forum</a>
        </div>
      ))}
    </div>
  )
}
