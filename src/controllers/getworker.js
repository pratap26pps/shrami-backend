import Worker from "../models/Worker.js";

export const getWorkers = async (req, res) => {
  try {
    const workers = await Worker.find();

    res.status(200).json({
      success: true,
      count: workers.length,
      data: workers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch workers",
      error: error.message,
    });
  }
};
