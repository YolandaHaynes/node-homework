const prisma = require("../db/prisma");


const getUserAnalytics = async (req, res) => {
  try {
    // Pare and validate user ID
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({
        message: "Invalid user ID.",
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {id: true }
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    // Use groupBy to count tasks by completion status
    const taskStats = await prisma.task.groupBy({
      by: ["isCompleted"],
      where: { userId },
      _count: {
        id: true,
      },
    });

    // Include recent task activity with eager loading
    const recentTasks = await prisma.task.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
        userId: true,
        User: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    // Calculate date progress using groupBy and calculate the date from one week ago
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Use grouBy with a where clause filtering by createdAt >= oneWeekAgo
    const weeklyProgress = await prisma.task.groupBy({
      by: ["createdAt"],
      where: {
        userId,
        createdAt: {
          gte: oneWeekAgo,
        },
      },
      _count: {
        id: true,
      },
    });

    return res.status(200).json({
      taskStats,
      recentTasks,
      weeklyProgress,
    });
  } catch (err) {
    console.error("Could not fetch user analytics:", err);
    return res.status(500).json({
      message: "Could not fetch user analytics.",
    });
  }
};


const getUsersWithStats = async (req, res) => {
  try {
    // Parse pagination parameters
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));

    if (page <1){
        return res.status(400).json({
            message:"Page must be greater than or equal to 1",
        });
    }

    if (limit <1 || limit >100){
        return res.status(400).json({
            message: "Limit must be between 1 and 100",
        });
    }

    const skip = (page - 1) * limit;

    // Get users with task counts using _count aggregation
    const usersRaw = await prisma.user.findMany({
      include: {
        Task: {
          where: { isCompleted: false },
          select: { id: true },
          take: 5,
        },
        _count: {
          select: {
            Task: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform to only include the fields we want
    const users = usersRaw.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      _count: user._count,
      Task: user.Task,
    }));

    // Get total count for pagination
    const totalUsers = await prisma.user.count();

    // Build pagination object with page, limit, total, pages, hasNext, hasPrev
    const pagination = {
      page,
      limit,
      total: totalUsers,
      pages: Math.ceil(totalUsers / limit),
      hasNext: page * limit < totalUsers,
      hasPrev: page > 1,
    };

    return res.status(200).json({
      users,
      pagination,
    });
  } catch (err) {
    console.error("Could not fetch users with stats:", err);
    return res.status(500).json({
      message: "Could not fetch users with stats.",
    });
  }
};

const searchTasks = async (req,res)=>{

    const searchQuery = req.query.q;

    // Validate search query
if (!searchQuery || searchQuery.trim().length < 2) {
  return res.status(400).json({ 
    error: "Search query must be at least 2 characters long" 
  });
}

// Get limit from query (default to 20)
const limit = parseInt(req.query.limit) || 20;

// Construct search patterns outside the query for proper parameterization
const searchPattern = `%${searchQuery}%`;
const exactMatch = searchQuery;
const startsWith = `${searchQuery}%`;

try{
// Use raw SQL for complex text search with parameterized queries
const searchResults = await prisma.$queryRaw`
  SELECT 
    t.id,
    t.title,
    t.is_completed as "isCompleted",
    t.priority,
    t.created_at as "createdAt",
    t.user_id as "userId",
    u.name as "user_name"
  FROM tasks t
  JOIN users u ON t.user_id = u.id
  WHERE t.title ILIKE ${searchPattern} 
     OR u.name ILIKE ${searchPattern}
  ORDER BY 
    CASE 
      WHEN t.title ILIKE ${exactMatch} THEN 1
      WHEN t.title ILIKE ${startsWith} THEN 2
      WHEN t.title ILIKE ${searchPattern} THEN 3
      ELSE 4
    END,
    t.created_at DESC
  LIMIT ${parseInt(limit)}
`;

// Return results with query and count
// Hint: The test expects results array, query string, and count number
res.status(200).json({
    results: searchResults,
    query: searchQuery,
    count: searchResults.length
});
} catch (err) {
    return res.status(500).json({
        error: "Could not search tasks.",
});
}
};



exports.getUserAnalytics = getUserAnalytics;
exports.getUsersWithStats = getUsersWithStats;
exports.searchTasks = searchTasks;