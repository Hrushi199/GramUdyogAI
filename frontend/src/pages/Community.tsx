import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

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
  const [activeTab, setActiveTab] = useState('feed');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulate API loading
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Community Network</h1>
        <p className="text-gray-400">Connect with fellow entrepreneurs, mentors and opportunities</p>
      </div>
      
      {/* Navigation Tabs */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-800 rounded-lg p-1">
          <button 
            className={`px-4 py-2 rounded-md ${activeTab === 'feed' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}
            onClick={() => setActiveTab('feed')}
          >
            Activity Feed
          </button>
          <button 
            className={`px-4 py-2 rounded-md ${activeTab === 'connections' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}
            onClick={() => setActiveTab('connections')}
          >
            Connections
          </button>
          <button 
            className={`px-4 py-2 rounded-md ${activeTab === 'mentors' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}
            onClick={() => setActiveTab('mentors')}
          >
            Mentors
          </button>
          <button 
            className={`px-4 py-2 rounded-md ${activeTab === 'groups' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}
            onClick={() => setActiveTab('groups')}
          >
            Groups
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-400">Loading community...</p>
        </div>
      ) : (
        <div>
          {activeTab === 'feed' && (
            <div className="space-y-6">
              {/* Create Post */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center mb-4">
                  <img src="/api/placeholder/40/40" alt="Your profile" className="rounded-full mr-3" />
                  <input 
                    type="text" 
                    placeholder="Share an update or ask a question..." 
                    className="bg-gray-700 text-white rounded-full px-4 py-2 flex-grow focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md">
                    Post
                  </button>
                </div>
              </div>
              
              {/* Posts Feed */}
              {MOCK_POSTS.map(post => (
                <div key={post.id} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <img src="/api/placeholder/40/40" alt={post.author} className="rounded-full mr-3" />
                    <div>
                      <h3 className="font-medium text-white">{post.author}</h3>
                      <p className="text-gray-400 text-sm">{post.time}</p>
                    </div>
                  </div>
                  <div className="mb-4">
                    <p className="text-gray-200">{post.content}</p>
                  </div>
                  <div className="flex text-gray-400 border-t border-gray-700 pt-3">
                    <button className="flex items-center mr-6">
                      <span className="mr-1">👍</span> {post.likes}
                    </button>
                    <button className="flex items-center">
                      <span className="mr-1">💬</span> {post.comments}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {activeTab === 'connections' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {MOCK_CONNECTIONS.map(connection => (
                <div key={connection.id} className="bg-gray-800 rounded-lg p-4 flex">
                  <img src={connection.imgUrl} alt={connection.name} className="rounded-full h-16 w-16" />
                  <div className="ml-4">
                    <h3 className="font-medium text-white">{connection.name}</h3>
                    <p className="text-gray-400 text-sm">{connection.location}</p>
                    <div className="mt-2 flex flex-wrap">
                      {connection.skills.map((skill, i) => (
                        <span key={i} className="bg-gray-700 text-xs text-gray-300 px-2 py-1 rounded mr-1 mb-1">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              <div className="bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg p-4 flex items-center justify-center">
                <button className="text-blue-500 hover:text-blue-400">
                  + Find more connections
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'mentors' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {MOCK_MENTORS.map(mentor => (
                <div key={mentor.id} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <img src={mentor.imgUrl} alt={mentor.name} className="rounded-full h-16 w-16" />
                    <div className="ml-3">
                      <h3 className="font-medium text-white">{mentor.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded ${mentor.available ? 'bg-green-800 text-green-200' : 'bg-gray-700 text-gray-400'}`}>
                        {mentor.available ? 'Available for mentoring' : 'Currently unavailable'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <h4 className="text-sm text-gray-400 mb-1">Expertise:</h4>
                    <div className="flex flex-wrap">
                      {mentor.expertise.map((skill, i) => (
                        <span key={i} className="bg-gray-700 text-xs text-gray-300 px-2 py-1 rounded mr-1 mb-1">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md">
                    Request Mentorship
                  </button>
                </div>
              ))}
              <div className="bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg p-4 flex items-center justify-center">
                <button className="text-blue-500 hover:text-blue-400">
                  + Find more mentors
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'groups' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {MOCK_GROUPS.map(group => (
                <div key={group.id} className="bg-gray-800 rounded-lg p-4">
                  <h3 className="font-medium text-white text-lg mb-2">{group.name}</h3>
                  <div className="flex text-sm text-gray-400 mb-4">
                    <span className="mr-4">{group.members} members</span>
                    <span>{group.posts} posts</span>
                  </div>
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md">
                    Join Group
                  </button>
                </div>
              ))}
              <div className="bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg p-4 flex items-center justify-center">
                <button className="text-blue-500 hover:text-blue-400">
                  + Create new group
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}