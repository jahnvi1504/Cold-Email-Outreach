import { getRequestUser } from '../services/userService.js';
import { searchEmails } from '../services/searchService.js';

export const searchEmailJobs = async (request: any, response: any, next: any) => {
  try {
    const query = String(request.query.q ?? '').trim();
    if (!query) return response.json([]);
    const user = await getRequestUser(request.header('x-user-email'), request.userId);
    return response.json(await searchEmails(user.id, query));
  } catch (error) {
    return next(error);
  }
};
