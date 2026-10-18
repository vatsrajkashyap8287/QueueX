import mongoose from "mongoose";

import Queue from "../models/Queue.js";
import QueueEntry from "../models/QueueEntry.js";

// =====================================
// GET ADMIN ANALYTICS
// =====================================

export const getAdminAnalytics = async (req, res) => {
  try {
    const adminId = req.user._id;

    // Find queues owned by logged-in admin
    const queues = await Queue.find({
      createdBy: adminId
    });

    const queueIds = queues.map((queue) => queue._id);

    // Total tokens generated
    const totalEntries = await QueueEntry.countDocuments({
      queue: { $in: queueIds }
    });

    // Total completed services
    const completedServices = await QueueEntry.countDocuments({
      queue: { $in: queueIds },
      status: "completed"
    });

    // Currently waiting customers
    const waitingCustomers = await QueueEntry.countDocuments({
      queue: { $in: queueIds },
      status: "waiting"
    });

    // Currently serving customers
    const servingCustomers = await QueueEntry.countDocuments({
      queue: { $in: queueIds },
      status: "serving"
    });

    // Today's completed services
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCompleted = await QueueEntry.countDocuments({
      queue: { $in: queueIds },
      status: "completed",
      completedAt: { $gte: today }
    });

    // Average waiting time calculation
    const waitingStats = await QueueEntry.aggregate([
      {
        $match: {
          queue: { $in: queueIds },
          servedAt: { $type: "date" },
          joinedAt: { $type: "date" }
        }
      },
      {
        $group: {
          _id: null,
          averageWaitingTime: {
            $avg: {
              $divide: [
                { $subtract: ["$servedAt", "$joinedAt"] },
                60000
              ]
            }
          }
        }
      }
    ]);

    const averageWaitingTime =
      waitingStats.length > 0
        ? Number(
            waitingStats[0].averageWaitingTime.toFixed(2)
          )
        : 0;

    // Queue-wise analytics
    const queueAnalytics = await Promise.all(
      queues.map(async (queue) => {
        const total = await QueueEntry.countDocuments({
          queue: queue._id
        });

        const completed = await QueueEntry.countDocuments({
          queue: queue._id,
          status: "completed"
        });

        const waiting = await QueueEntry.countDocuments({
          queue: queue._id,
          status: "waiting"
        });

        return {
          queueId: queue._id,
          queueName: queue.name,
          status: queue.status,
          totalEntries: total,
          completedServices: completed,
          waitingCustomers: waiting
        };
      })
    );

    return res.status(200).json({
      success: true,

      analytics: {
        totalQueues: queues.length,
        totalEntries,
        completedServices,
        waitingCustomers,
        servingCustomers,
        todayCompleted,
        averageWaitingTime,
        queueAnalytics
      }
    });

  } catch (error) {
    console.error("Analytics Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch analytics"
    });
  }
};
// =====================================
// GET ADMIN ANALYTICS CHART DATA
// =====================================

export const getAdminChartAnalytics = async (req, res) => {
  try {
    const adminId = req.user._id;

    // Only queues owned by this admin
    const queues = await Queue.find({
      createdBy: adminId
    }).select("_id name");

    const queueIds = queues.map((queue) => queue._id);

    // =====================================
    // 1. Daily Activity (Last 7 Days)
    // =====================================

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - 6);

    const dailyJoined = await QueueEntry.aggregate([
      {
        $match: {
          queue: { $in: queueIds },
          joinedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$joinedAt"
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    const dailyCompleted = await QueueEntry.aggregate([
      {
        $match: {
          queue: { $in: queueIds },
          status: "completed",
          completedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$completedAt"
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    const joinedMap = Object.fromEntries(
      dailyJoined.map((item) => [item._id, item.count])
    );

    const completedMap = Object.fromEntries(
      dailyCompleted.map((item) => [item._id, item.count])
    );

    const dailyActivity = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const dateString = date.toISOString().split("T")[0];

      dailyActivity.push({
        date: dateString,
        joined: joinedMap[dateString] || 0,
        completed: completedMap[dateString] || 0
      });
    }

    // =====================================
    // 2. Queue Performance
    // =====================================

    const queuePerformance = await Promise.all(
      queues.map(async (queue) => {
        const completed = await QueueEntry.countDocuments({
          queue: queue._id,
          status: "completed"
        });

        const total = await QueueEntry.countDocuments({
          queue: queue._id
        });

        return {
          queueId: queue._id,
          queueName: queue.name,
          completed,
          total
        };
      })
    );

    // =====================================
    // 3. Token Status Distribution
    // =====================================

    const statusCounts = await QueueEntry.aggregate([
      {
        $match: {
          queue: { $in: queueIds }
        }
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const statusMap = Object.fromEntries(
      statusCounts.map((item) => [item._id, item.count])
    );

    const statusDistribution = [
      {
        name: "Waiting",
        value: statusMap.waiting || 0
      },
      {
        name: "Serving",
        value: statusMap.serving || 0
      },
      {
        name: "Completed",
        value: statusMap.completed || 0
      },
      {
        name: "Cancelled",
        value: statusMap.cancelled || 0
      }
    ];

    return res.status(200).json({
      success: true,
      charts: {
        dailyActivity,
        queuePerformance,
        statusDistribution
      }
    });

  } catch (error) {
    console.error("Chart Analytics Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch chart analytics"
    });
  }
};