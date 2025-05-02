// 1st version of the JobMentorDashboard component
// import { useEffect, useState } from 'react'

// export default function JobMentorDashboard() {
//   const [jobs, setJobs] = useState([])
//   const [mentors, setMentors] = useState([])

//   useEffect(() => {
//     fetch('/api/match/jobs').then(res => res.json()).then(setJobs)
//     fetch('/api/match/mentors').then(res => res.json()).then(setMentors)
//   }, [])

//   return (
//     <div className="max-w-4xl mx-auto p-4">
//       <h2 className="text-xl font-bold">🔍 Matched Jobs</h2>
//       {jobs.map((job: any) => (
//         <div key={job.id} className="border p-2 my-2 rounded">{job.title} @ {job.org}</div>
//       ))}

//       <h2 className="text-xl font-bold mt-6">🤝 Mentorship Opportunities</h2>
//       {mentors.map((m: any) => (
//         <div key={m.id} className="border p-2 my-2 rounded">
//           {m.name} - Skills: {m.skills.join(', ')}
//           <a href={m.discourseProfile} className="text-blue-600 ml-2" target="_blank">Message on Forum</a>
//         </div>
//       ))}
//     </div>
//   )
// }

// 2nd version of the JobMentorDashboard component with added features and styling
// import { useEffect, useState } from 'react';

// export default function JobMentorDashboard() {
//   const [jobs, setJobs] = useState([]);
//   const [mentors, setMentors] = useState([]);

//   useEffect(() => {
//     fetch('/api/match/jobs').then(res => res.json()).then(setJobs);
//     fetch('/api/match/mentors').then(res => res.json()).then(setMentors);
//   }, []);

//   const features = [
//     {
//       title: 'AI Business Suggestions',
//       icon: '🤖',
//       description: 'Get personalized business recommendations based on your skills, resources, and market conditions.'
//     },
//     {
//       title: 'Government Schemes',
//       icon: '🏛️',
//       description: 'Access a curated database of relevant programs, subsidies, and initiatives.'
//     },
//     {
//       title: 'Networking Opportunities',
//       icon: '🌐',
//       description: 'Find and connect with like-minded professionals through events and listings.'
//     },
//     {
//       title: 'Skills Development',
//       icon: '🎓',
//       description: 'Access training resources to build the skills you need to grow your business.'
//     },
//   ];

//   return (
//     <div className="max-w-6xl mx-auto px-4 py-10 space-y-12">
//       <h1 className="text-3xl font-bold text-center">🚀 Your Business Dashboard</h1>

//       {/* Features Section */}
//       <section>
//         <h2 className="text-2xl font-semibold mb-6 text-center">🧰 Comprehensive Business Support</h2>
//         <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
//           {features.map((feature, idx) => (
//             <div key={idx} className="bg-gradient-to-br from-purple-800/50 to-blue-900/50 text-white p-5 rounded-2xl shadow-lg">
//               <div className="text-4xl mb-3">{feature.icon}</div>
//               <h3 className="font-bold text-lg">{feature.title}</h3>
//               <p className="text-sm mt-2 text-gray-200">{feature.description}</p>
//             </div>
//           ))}
//         </div>
//       </section>

//       {/* Jobs Section */}
//       <section>
//         <h2 className="text-2xl font-semibold mb-4">🔍 Matched Jobs</h2>
//         <div className="grid md:grid-cols-2 gap-4">
//           {jobs.length ? jobs.map((job: any) => (
//             <div key={job.id} className="border border-purple-700 p-4 rounded-xl bg-white shadow">
//               <h4 className="font-bold">{job.title}</h4>
//               <p className="text-sm text-gray-600">at {job.org}</p>
//             </div>
//           )) : <p className="text-gray-400">No jobs found</p>}
//         </div>
//       </section>

//       {/* Mentors Section */}
//       <section>
//         <h2 className="text-2xl font-semibold mb-4">🤝 Mentorship Opportunities</h2>
//         <div className="grid md:grid-cols-2 gap-4">
//           {mentors.length ? mentors.map((m: any) => (
//             <div key={m.id} className="border border-blue-700 p-4 rounded-xl bg-white shadow">
//               <h4 className="font-bold">{m.name}</h4>
//               <p className="text-sm text-gray-700">Skills: {m.skills.join(', ')}</p>
//               <a href={m.discourseProfile} className="text-indigo-600 underline mt-2 inline-block" target="_blank">
//                 Message on Forum
//               </a>
//             </div>
//           )) : <p className="text-gray-400">No mentors found</p>}
//         </div>
//       </section>
//     </div>
//   );
// }

import { useEffect, useState } from 'react';

export default function JobMentorDashboard() {
  const [jobs, setJobs] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [schemes, setSchemes] = useState([]);

  useEffect(() => {
    fetch('/api/match/jobs').then(res => res.json()).then(setJobs);
    fetch('/api/match/mentors').then(res => res.json()).then(setMentors);
    fetch('/api/match/business-suggestions').then(res => res.json()).then(setSuggestions);
    fetch('/api/match/schemes').then(res => res.json()).then(setSchemes);
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-12 text-white">
      <h1 className="text-3xl font-bold text-center mb-8">📊 Your Business Dashboard</h1>

      {/* AI Business Suggestions */}
      <section>
        <h2 className="text-2xl font-semibold mb-2">🤖 AI Business Suggestions</h2>
        {suggestions.length ? (
          <ul className="list-disc list-inside text-sm text-gray-300">
            {suggestions.map((s: any, i: number) => (
              <li key={i}>{s.recommendation}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400">No suggestions found</p>
        )}
      </section>

      {/* Government Schemes */}
      <section>
        <h2 className="text-2xl font-semibold mb-2">🏛️ Government Schemes</h2>
        {schemes.length ? (
          <ul className="list-disc list-inside text-sm text-gray-300">
            {schemes.map((s: any, i: number) => (
              <li key={i}>
                <strong>{s.name}</strong> – {s.description}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400">No schemes found</p>
        )}
      </section>

      {/* Jobs */}
      <section>
        <h2 className="text-2xl font-semibold mb-2">🔍 Matched Jobs</h2>
        {jobs.length ? (
          jobs.map((job: any) => (
            <div key={job.id} className="border border-purple-700 p-4 rounded-xl bg-white text-black shadow my-2">
              <h4 className="font-bold">{job.title}</h4>
              <p className="text-sm">at {job.org}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-400">No jobs found</p>
        )}
      </section>

      {/* Mentors */}
      <section>
        <h2 className="text-2xl font-semibold mb-2">🤝 Mentorship Opportunities</h2>
        {mentors.length ? (
          mentors.map((m: any) => (
            <div key={m.id} className="border border-blue-700 p-4 rounded-xl bg-white text-black shadow my-2">
              <h4 className="font-bold">{m.name}</h4>
              <p className="text-sm">Skills: {m.skills.join(', ')}</p>
              <a href={m.discourseProfile} className="text-indigo-600 underline mt-1 inline-block" target="_blank">
                Message on Forum
              </a>
            </div>
          ))
        ) : (
          <p className="text-gray-400">No mentors found</p>
        )}
      </section>
    </div>
  );
}
