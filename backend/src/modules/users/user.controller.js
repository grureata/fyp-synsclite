
const ApiResponse = require('../../utils/ApiResponse');
const { listUsers } = require('./user.service');

async function getAllUsers(req, res, next) {
  try {
    const data = await listUsers();
    return ApiResponse.success(res, data, 'Users retrieved.');
  } catch (error) {
    return next(error);
  }
}

module.exports = { getAllUsers };
