const validateTimeFormat = (time) => {
  const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/;
  return timeRegex.test(time);
};

const validateStationData = (req, res, next) => {
  const { name, description, numberOfConnectors, ratePerHour, openingTime, closingTime, status } = req.body;

  // Check required fields
  if (!name || !description || !numberOfConnectors || !ratePerHour || !openingTime || !closingTime) {
    return res.status(400).json({ message: 'Name, description, number of connectors, rate per hour, opening time, and closing time are required' });
  }

  // Validate number of connectors
  if (numberOfConnectors < 1) {
    return res.status(400).json({ message: 'Number of connectors must be at least 1' });
  }

  // Validate rate per hour
  if (ratePerHour < 0) {
    return res.status(400).json({ message: 'Rate per hour must be a positive number' });
  }

  // Validate time format
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9] (AM|PM)$/;
  if (!timeRegex.test(openingTime) || !timeRegex.test(closingTime)) {
    return res.status(400).json({ message: 'Invalid time format. Use HH:MM AM/PM' });
  }

  // Validate time range
  const opening = new Date(`2000-01-01 ${openingTime}`);
  const closing = new Date(`2000-01-01 ${closingTime}`);
  if (opening >= closing) {
    return res.status(400).json({ message: 'Opening time must be before closing time' });
  }

  // Validate status if provided
  if (status && !['active', 'maintenance', 'inactive'].includes(status.toLowerCase())) {
    return res.status(400).json({ message: 'Invalid status. Must be one of: active, maintenance, inactive' });
  }

  // Convert status to lowercase if provided
  if (status) {
    req.body.status = status.toLowerCase();
  }

  next();
};

module.exports = {
  validateStationData,
  validateTimeFormat
}; 