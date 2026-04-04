import { useEffect, useState } from "react";
import { PostsAPI, Post } from "@/lib/api/posts";
import { format } from "date-fns";
import { ExternalLink, Eye, ThumbsUp, MessageSquare, BarChart2 } from "lucide-react";

export function PostList() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        PostsAPI.getPosts()
            .then(data => setPosts(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading && posts.length === 0) {
        return <div className="p-8 text-center text-gray-500 animate-pulse bg-[#1e1f21] rounded-xl border border-gray-800">Loading post performance...</div>;
    }

    return (
        <div className="bg-[#1e1f21] rounded-xl shadow-sm border border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-800 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-gray-100">Post Performance</h2>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-900/50 text-gray-400">
                        <tr>
                            <th className="px-6 py-4 font-medium border-b border-gray-800">Title</th>
                            <th className="px-6 py-4 font-medium border-b border-gray-800">Published</th>
                            <th className="px-6 py-4 font-medium text-right border-b border-gray-800">Views</th>
                            <th className="px-6 py-4 font-medium text-right border-b border-gray-800">Open Rate</th>
                            <th className="px-6 py-4 font-medium text-right border-b border-gray-800">Likes</th>
                            <th className="px-6 py-4 font-medium text-right border-b border-gray-800">Comments</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {posts.map((post) => (
                            <tr key={post.id} className="hover:bg-gray-800/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="font-medium text-gray-100 truncate max-w-md" title={post.title}>
                                            {post.title}
                                        </span>
                                        <a
                                            href={post.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                        >
                                            View Post <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-400 whitespace-nowrap">
                                    {post.publishedAt ? format(new Date(post.publishedAt), 'MMM d, yyyy') : '-'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-1.5 text-gray-200 font-medium">
                                        <Eye className="w-4 h-4 text-gray-500" />
                                        {post.views.toLocaleString()}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-800/50">
                                        {post.openRate}%
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-1.5 text-gray-200">
                                        <ThumbsUp className="w-4 h-4 text-gray-500" />
                                        {post.likes.toLocaleString()}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-1.5 text-gray-200">
                                        <MessageSquare className="w-4 h-4 text-gray-500" />
                                        {post.comments.toLocaleString()}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {posts.length === 0 && !loading && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    No posts tracked yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
