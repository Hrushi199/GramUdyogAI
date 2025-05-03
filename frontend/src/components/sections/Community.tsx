// 1st version 
// import { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';

// // Mock data - replace with actual API calls to your Forem instance
// const MOCK_CONNECTIONS = [
//   { id: 1, name: "Rajesh Kumar", skills: ["Dairy Farming", "Organic Produce"], location: "Bihar", imgUrl: "/api/placeholder/64/64" },
//   { id: 2, name: "Meena Devi", skills: ["Handicrafts", "Textiles"], location: "Rajasthan", imgUrl: "/api/placeholder/64/64" },
//   { id: 3, name: "Anand Singh", skills: ["Poultry Farming", "Feed Production"], location: "Uttar Pradesh", imgUrl: "/api/placeholder/64/64" }
// ];

// const MOCK_MENTORS = [
//   { id: 101, name: "Dr. Sharma", expertise: ["Business Planning", "Agricultural Science"], available: true, imgUrl: "/api/placeholder/64/64" },
//   { id: 102, name: "Priya Jain", expertise: ["Marketing", "E-commerce"], available: false, imgUrl: "/api/placeholder/64/64" }
// ];

// const MOCK_GROUPS = [
//   { id: 201, name: "Women Entrepreneurs", members: 240, posts: 56 },
//   { id: 202, name: "Agricultural Innovations", members: 185, posts: 34 },
//   { id: 203, name: "Handicraft Artisans", members: 122, posts: 27 }
// ];

// const MOCK_POSTS = [
//   { 
//     id: 301, 
//     author: "Meena Devi", 
//     content: "Just received my first bulk order for handcrafted textiles! Looking for advice on scaling production while maintaining quality.", 
//     likes: 24, 
//     comments: 7, 
//     time: "2 hours ago" 
//   },
//   { 
//     id: 302, 
//     author: "Rajesh Kumar", 
//     content: "Has anyone applied for the Rural Enterprise Development grant? The application process seems complicated.", 
//     likes: 18, 
//     comments: 12, 
//     time: "1 day ago" 
//   }
// ];

// export default function Community() {
//   const [activeTab, setActiveTab] = useState('feed');
//   const [loading, setLoading] = useState(true);
  
//   useEffect(() => {
//     // Simulate API loading
//     const timer = setTimeout(() => setLoading(false), 1000);
//     return () => clearTimeout(timer);
//   }, []);

//   return (
//     <div className="container mx-auto px-4 py-8 max-w-6xl">
//       <div className="mb-12 text-center">
//         <h1 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">Community Network</h1>
//         <p className="text-gray-300 text-lg">Connect with fellow entrepreneurs, mentors and opportunities</p>
//       </div>
      
//       {/* Navigation Tabs */}
//       <div className="flex justify-center mb-10">
//         <div className="bg-gray-800 rounded-xl p-1.5 shadow-lg">
//           {['feed', 'connections', 'mentors', 'groups'].map((tab) => (
//             <button 
//               key={tab}
//               className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
//                 activeTab === tab 
//                   ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md' 
//                   : 'text-gray-300 hover:text-white hover:bg-gray-700'
//               }`}
//               onClick={() => setActiveTab(tab)}
//             >
//               {tab.charAt(0).toUpperCase() + tab.slice(1)}
//             </button>
//           ))}
//         </div>
//       </div>
      
//       {loading ? (
//         <div className="text-center py-16">
//           <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
//           <p className="mt-4 text-gray-300 text-lg">Loading community...</p>
//         </div>
//       ) : (
//         <div>
//           {activeTab === 'feed' && (
//             <div className="space-y-6">
//               {/* Create Post */}
//               <div className="bg-gray-800 rounded-xl p-5 shadow-lg border border-gray-700">
//                 <div className="flex items-center mb-4">
//                   <img src="/api/placeholder/40/40" alt="Your profile" className="rounded-full mr-3 ring-2 ring-blue-500 p-0.5" />
//                   <input 
//                     type="text" 
//                     placeholder="Share an update or ask a question..." 
//                     className="bg-gray-700 text-white rounded-full px-5 py-3 flex-grow focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
//                   />
//                 </div>
//                 <div className="flex justify-end">
//                   <button className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium px-6 py-2.5 rounded-lg transition-all duration-200 shadow-md">
//                     Post
//                   </button>
//                 </div>
//               </div>
              
//               {/* Posts Feed */}
//               {MOCK_POSTS.map(post => (
//                 <div key={post.id} className="bg-gray-800 rounded-xl p-5 shadow-lg transform transition-all duration-200 hover:shadow-xl border border-gray-700">
//                   <div className="flex items-center mb-4">
//                     <img src="/api/placeholder/40/40" alt={post.author} className="rounded-full mr-3 ring-2 ring-blue-500 p-0.5" />
//                     <div>
//                       <h3 className="font-semibold text-white">{post.author}</h3>
//                       <p className="text-gray-400 text-sm">{post.time}</p>
//                     </div>
//                   </div>
//                   <div className="mb-5">
//                     <p className="text-gray-200 text-lg">{post.content}</p>
//                   </div>
//                   <div className="flex text-gray-300 border-t border-gray-700 pt-4">
//                     <button className="flex items-center mr-8 hover:text-blue-400 transition-colors duration-200">
//                       <span className="mr-2 text-xl">👍</span> {post.likes}
//                     </button>
//                     <button className="flex items-center hover:text-blue-400 transition-colors duration-200">
//                       <span className="mr-2 text-xl">💬</span> {post.comments}
//                     </button>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
          
//           {activeTab === 'connections' && (
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//               {MOCK_CONNECTIONS.map(connection => (
//                 <div key={connection.id} className="bg-gray-800 rounded-xl p-5 shadow-lg flex hover:shadow-xl transition-all duration-200 border border-gray-700">
//                   <img src={connection.imgUrl} alt={connection.name} className="rounded-full h-16 w-16 ring-2 ring-blue-500 p-0.5" />
//                   <div className="ml-4">
//                     <h3 className="font-semibold text-white text-lg">{connection.name}</h3>
//                     <p className="text-gray-400">{connection.location}</p>
//                     <div className="mt-3 flex flex-wrap">
//                       {connection.skills.map((skill, i) => (
//                         <span key={i} className="bg-gray-700 text-xs text-blue-300 px-3 py-1 rounded-full mr-1 mb-1">
//                           {skill}
//                         </span>
//                       ))}
//                     </div>
//                   </div>
//                 </div>
//               ))}
//               <div className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-xl p-6 flex items-center justify-center shadow-lg">
//                 <button className="text-blue-400 hover:text-blue-300 font-medium text-lg transition-colors duration-200">
//                   + Find more connections
//                 </button>
//               </div>
//             </div>
//           )}
          
//           {activeTab === 'mentors' && (
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//               {MOCK_MENTORS.map(mentor => (
//                 <div key={mentor.id} className="bg-gray-800 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-700">
//                   <div className="flex items-center mb-4">
//                     <img src={mentor.imgUrl} alt={mentor.name} className="rounded-full h-16 w-16 ring-2 ring-blue-500 p-0.5" />
//                     <div className="ml-4">
//                       <h3 className="font-semibold text-white text-lg">{mentor.name}</h3>
//                       <span className={`text-xs px-3 py-1 rounded-full ${
//                         mentor.available 
//                           ? 'bg-green-900 text-green-200' 
//                           : 'bg-gray-700 text-gray-400'
//                       }`}>
//                         {mentor.available ? 'Available for mentoring' : 'Currently unavailable'}
//                       </span>
//                     </div>
//                   </div>
//                   <div className="mt-3">
//                     <h4 className="text-sm text-gray-300 mb-2">Expertise:</h4>
//                     <div className="flex flex-wrap">
//                       {mentor.expertise.map((skill, i) => (
//                         <span key={i} className="bg-gray-700 text-xs text-blue-300 px-3 py-1 rounded-full mr-1 mb-1">
//                           {skill}
//                         </span>
//                       ))}
//                     </div>
//                   </div>
//                   <button className="mt-5 w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium px-4 py-2.5 rounded-lg transition-all duration-200 shadow-md">
//                     Request Mentorship
//                   </button>
//                 </div>
//               ))}
//               <div className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-xl p-6 flex items-center justify-center shadow-lg">
//                 <button className="text-blue-400 hover:text-blue-300 font-medium text-lg transition-colors duration-200">
//                   + Find more mentors
//                 </button>
//               </div>
//             </div>
//           )}
          
//           {activeTab === 'groups' && (
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//               {MOCK_GROUPS.map(group => (
//                 <div key={group.id} className="bg-gray-800 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-700">
//                   <h3 className="font-semibold text-white text-xl mb-3">{group.name}</h3>
//                   <div className="flex text-sm text-gray-300 mb-5">
//                     <span className="mr-6 flex items-center">
//                       <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
//                         <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
//                       </svg>
//                       {group.members} members
//                     </span>
//                     <span className="flex items-center">
//                       <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
//                         <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
//                       </svg>
//                       {group.posts} posts
//                     </span>
//                   </div>
//                   <button className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium px-4 py-2.5 rounded-lg transition-all duration-200 shadow-md">
//                     Join Group
//                   </button>
//                 </div>
//               ))}
//               <div className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-xl p-6 flex items-center justify-center shadow-lg">
//                 <button className="text-blue-400 hover:text-blue-300 font-medium text-lg transition-colors duration-200">
//                   + Create new group
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Mock data - replace with actual API calls to your Forem instance
const MOCK_CONNECTIONS = [
  { id: 1, name: "Rajesh Kumar", skills: ["Dairy Farming", "Organic Produce"], location: "Bihar", imgUrl: "/api/placeholder/64/64" },
  { id: 2, name: "Meena Devi", skills: ["Handicrafts", "Textiles"], location: "Rajasthan", imgUrl: "/api/placeholder/64/64" },
  { id: 3, name: "Anand Singh", skills: ["Poultry Farming", "Feed Production"], location: "Uttar Pradesh", imgUrl: "/api/placeholder/64/64" }
];

const MOCK_MENTORS = [
  { id: 101, name: "Dr. Sharma", expertise: ["Business Planning", "Agricultural Science"], available: true, imgUrl: "/api/placeholder/64/64" },
  { id: 102, name: "Priya Jain", expertise: ["Marketing", "E-commerce"], available: false, imgUrl: "/api/placeholder/64/64" }
];

const MOCK_GROUPS = [
  { id: 201, name: "Women Entrepreneurs", members: 240, posts: 56 },
  { id: 202, name: "Agricultural Innovations", members: 185, posts: 34 },
  { id: 203, name: "Handicraft Artisans", members: 122, posts: 27 }
];

const MOCK_POSTS = [
  { 
    id: 301, 
    author: "Meena Devi", 
    content: "Just received my first bulk order for handcrafted textiles! Looking for advice on scaling production while maintaining quality.", 
    likes: 24, 
    comments: 7, 
    time: "2 hours ago" 
  },
  { 
    id: 302, 
    author: "Rajesh Kumar", 
    content: "Has anyone applied for the Rural Enterprise Development grant? The application process seems complicated.", 
    likes: 18, 
    comments: 12, 
    time: "1 day ago" 
  }
];

export default function Community() {
  const { t, ready } = useTranslation('community');
  const [activeTab, setActiveTab] = useState('feed');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (ready) {
      // Simulate API loading
      const timer = setTimeout(() => setLoading(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [ready]);

  if (!ready || loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-300 text-lg">{t('community.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
          {t('community.title')}
        </h1>
        <p className="text-gray-300 text-lg">{t('community.subtitle')}</p>
      </div>
      
      {/* Navigation Tabs */}
      <div className="flex justify-center mb-10">
        <div className="bg-gray-800 rounded-xl p-1.5 shadow-lg">
          {['feed', 'connections', 'mentors', 'groups'].map((tab) => (
            <button 
              key={tab}
              className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                activeTab === tab 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {t(`community.tabs.${tab}`)}
            </button>
          ))}
        </div>
      </div>
      
      <div>
        {activeTab === 'feed' && (
          <div className="space-y-6">
            {/* Create Post */}
            <div className="bg-gray-800 rounded-xl p-5 shadow-lg border border-gray-700">
              <div className="flex items-center mb-4">
                <img src="/api/placeholder/40/40" alt="Your profile" className="rounded-full mr-3 ring-2 ring-blue-500 p-0.5" />
                <input 
                  type="text" 
                  placeholder={t('community.feed.create_post_placeholder')} 
                  className="bg-gray-700 text-white rounded-full px-5 py-3 flex-grow focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                />
              </div>
              <div className="flex justify-end">
                <button className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium px-6 py-2.5 rounded-lg transition-all duration-200 shadow-md">
                  {t('community.feed.post_button')}
                </button>
              </div>
            </div>
            
            {/* Posts Feed */}
            {MOCK_POSTS.map(post => (
              <div key={post.id} className="bg-gray-800 rounded-xl p-5 shadow-lg transform transition-all duration-200 hover:shadow-xl border border-gray-700">
                <div className="flex items-center mb-4">
                  <img src="/api/placeholder/40/40" alt={post.author} className="rounded-full mr-3 ring-2 ring-blue-500 p-0.5" />
                  <div>
                    <h3 className="font-semibold text-white">{post.author}</h3>
                    <p className="text-gray-400 text-sm">{post.time}</p>
                  </div>
                </div>
                <div className="mb-5">
                  <p className="text-gray-200 text-lg">{post.content}</p>
                </div>
                <div className="flex text-gray-300 border-t border-gray-700 pt-4">
                  <button className="flex items-center mr-8 hover:text-blue-400 transition-colors duration-200">
                    <span className="mr-2 text-xl">👍</span> {post.likes} {t('community.feed.likes')}
                  </button>
                  <button className="flex items-center hover:text-blue-400 transition-colors duration-200">
                    <span className="mr-2 text-xl">💬</span> {post.comments} {t('community.feed.comments')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'connections' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOCK_CONNECTIONS.map(connection => (
              <div key={connection.id} className="bg-gray-800 rounded-xl p-5 shadow-lg flex hover:shadow-xl transition-all duration-200 border border-gray-700">
                <img src={connection.imgUrl} alt={connection.name} className="rounded-full h-16 w-16 ring-2 ring-blue-500 p-0.5" />
                <div className="ml-4">
                  <h3 className="font-semibold text-white text-lg">{connection.name}</h3>
                  <p className="text-gray-400">{connection.location}</p>
                  <div className="mt-3 flex flex-wrap">
                    {connection.skills.map((skill, i) => (
                      <span key={i} className="bg-gray-700 text-xs text-blue-300 px-3 py-1 rounded-full mr-1 mb-1">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <div className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-xl p-6 flex items-center justify-center shadow-lg">
              <button className="text-blue-400 hover:text-blue-300 font-medium text-lg transition-colors duration-200">
                + {t('community.connections.find_more')}
              </button>
            </div>
          </div>
        )}
        
        {activeTab === 'mentors' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOCK_MENTORS.map(mentor => (
              <div key={mentor.id} className="bg-gray-800 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-700">
                <div className="flex items-center mb-4">
                  <img src={mentor.imgUrl} alt={mentor.name} className="rounded-full h-16 w-16 ring-2 ring-blue-500 p-0.5" />
                  <div className="ml-4">
                    <h3 className="font-semibold text-white text-lg">{mentor.name}</h3>
                    <span className={`text-xs px-3 py-1 rounded-full ${
                      mentor.available 
                        ? 'bg-green-900 text-green-200' 
                        : 'bg-gray-700 text-gray-400'
                    }`}>
                      {mentor.available ? t('community.mentors.available') : t('community.mentors.unavailable')}
                    </span>
                  </div>
                </div>
                <div className="mt-3">
                  <h4 className="text-sm text-gray-300 mb-2">{t('community.mentors.expertise')}</h4>
                  <div className="flex flex-wrap">
                    {mentor.expertise.map((skill, i) => (
                      <span key={i} className="bg-gray-700 text-xs text-blue-300 px-3 py-1 rounded-full mr-1 mb-1">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <button className="mt-5 w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium px-4 py-2.5 rounded-lg transition-all duration-200 shadow-md">
                  {t('community.mentors.request_mentorship')}
                </button>
              </div>
            ))}
            <div className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-xl p-6 flex items-center justify-center shadow-lg">
              <button className="text-blue-400 hover:text-blue-300 font-medium text-lg transition-colors duration-200">
                + {t('community.mentors.find_more')}
              </button>
            </div>
          </div>
        )}
        
        {activeTab === 'groups' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOCK_GROUPS.map(group => (
              <div key={group.id} className="bg-gray-800 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-700">
                <h3 className="font-semibold text-white text-xl mb-3">{group.name}</h3>
                <div className="flex text-sm text-gray-300 mb-5">
                  <span className="mr-6 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                    {t('community.groups.members', { count: group.members })}
                  </span>
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    {t('community.groups.posts', { count: group.posts })}
                  </span>
                </div>
                <button className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium px-4 py-2.5 rounded-lg transition-all duration-200 shadow-md">
                  {t('community.groups.join_group')}
                </button>
              </div>
            ))}
            <div className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-xl p-6 flex items-center justify-center shadow-lg">
              <button className="text-blue-400 hover:text-blue-300 font-medium text-lg transition-colors duration-200">
                + {t('community.groups.create_new')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}