const validateTimeFormat = (time) => {
  const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/;
  return timeRegex.test(time);
};

const validateStationData = (req, res, next) => {
  const { name, location, openingTime, closingTime, totalChargers, status } = req.body;

  // Validate required fields
  if (!name || !location || !openingTime || !closingTime || !totalChargers) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Validate time format
  if (!validateTimeFormat(openingTime) || !validateTimeFormat(closingTime)) {
    return res.status(400).json({ 
      error: 'Invalid time format. Use format: HH:mm AM/PM (e.g., 08:00 AM)' 
    });
  }

  // Convert times to comparable format
  const openTime = new Date(`1970-01-01 ${openingTime}`);
  const closeTime = new Date(`1970-01-01 ${closingTime}`);

  // Validate time range
  if (openTime >= closeTime) {
    return res.status(400).json({ error: 'Opening time must be before closing time' });
  }

  // Validate total chargers
  if (totalChargers < 1) {
    return res.status(400).json({ error: 'Total chargers must be at least 1' });
  }

  // Validate status if provided
  if (status && !['Active', 'Inactive'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be either Active or Inactive' });
  }

  next();
};

module.exports = {
  validateStationData,
  validateTimeFormat
}; 