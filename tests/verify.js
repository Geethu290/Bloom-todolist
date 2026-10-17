/**
 * tests/verify.js
 * Verification Test Suite for Bloom To-Do List with Multi-User Authentication
 * Tests static assets, registration, login, duplicate email prevention, credential validation,
 * session cookies, private task scoping, cross-user isolation, and logout.
 */

const http = require('http');
const mongoose = require('mongoose');
const Task = require('../models/Task');
const User = require('../models/User');
const { app } = require('../server');

async function runTests() {
  console.log('\n🌸 Starting Bloom Full-Stack Auth & Task Verification Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // Start test server on dynamic high port
  const testServer = http.createServer(app);
  await new Promise((resolve) => testServer.listen(0, resolve));
  const port = testServer.address().port;
  const baseUrl = `http://localhost:${port}`;

  // Helper for HTTP requests that automatically handles JSON bodies and cookies
  function makeRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, baseUrl);
      const reqHeaders = Object.assign({}, options.headers || {});

      if (options.cookie) {
        reqHeaders['Cookie'] = options.cookie;
      }

      if (options.body && typeof options.body === 'object') {
        reqHeaders['Content-Type'] = 'application/json';
      }

      const reqOptions = {
        method: options.method || 'GET',
        headers: reqHeaders,
      };

      const req = http.request(url, reqOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(data);
          } catch (e) {}

          // Extract session cookie from Set-Cookie header if present
          let setCookie = null;
          if (res.headers['set-cookie']) {
            const rawCookie = Array.isArray(res.headers['set-cookie'])
              ? res.headers['set-cookie'][0]
              : res.headers['set-cookie'];
            setCookie = rawCookie.split(';')[0];
          }

          resolve({
            status: res.statusCode,
            headers: res.headers,
            setCookie: setCookie,
            text: data,
            json: json,
          });
        });
      });

      req.on('error', reject);
      if (options.body) {
        req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
      }
      req.end();
    });
  }

  try {
    // -----------------------------------------------------------------------
    // 1. Static Files & Routing Protection
    // -----------------------------------------------------------------------
    console.log('--- 1. Static Files & Route Protection ---');

    // Unauthenticated GET / must redirect to /login.html
    const rootRes = await makeRequest('/');
    assert(rootRes.status === 302, 'Unauthenticated GET / redirects with HTTP 302');
    assert(
      rootRes.headers.location && rootRes.headers.location.includes('/login.html'),
      'Unauthenticated GET / redirects to /login.html'
    );

    // Login page
    const loginRes = await makeRequest('/login.html');
    assert(loginRes.status === 200, 'GET /login.html returns HTTP 200');
    assert(loginRes.text.includes('Welcome to Bloom — Sign In'), 'login.html contains Sign In title');
    assert(loginRes.text.includes('tend to your little list'), 'login.html contains tagline');
    assert(loginRes.text.includes('password-toggle-btn'), 'login.html contains show/hide password toggle');

    // Register page
    const regRes = await makeRequest('/register.html');
    assert(regRes.status === 200, 'GET /register.html returns HTTP 200');
    assert(regRes.text.includes('Join Bloom — Create Your Account'), 'register.html contains Create Your Account title');

    // Static CSS & JS files
    const cssRes = await makeRequest('/css/style.css');
    assert(cssRes.status === 200 && cssRes.text.includes('--rose-main'), 'style.css loaded with custom variables');

    const authJsRes = await makeRequest('/js/auth.js');
    assert(authJsRes.status === 200 && authJsRes.text.includes('password-toggle-btn'), 'auth.js loaded successfully');

    const appJsRes = await makeRequest('/js/app.js');
    assert(appJsRes.status === 200 && appJsRes.text.includes('checkUserSession'), 'app.js loaded with session check');

    // API Health check
    const healthRes = await makeRequest('/api/health');
    assert(healthRes.status === 200 && healthRes.json.status === 'ok', '/api/health returns status ok');

    // -----------------------------------------------------------------------
    // 2. Reject Unauthenticated API Requests
    // -----------------------------------------------------------------------
    console.log('\n--- 2. Unauthenticated API Protection ---');
    const unauthGetTasks = await makeRequest('/api/tasks');
    assert(unauthGetTasks.status === 401, 'GET /api/tasks without session returns HTTP 401 Unauthorized');
    assert(
      unauthGetTasks.json && unauthGetTasks.json.message.includes('Authentication required'),
      'GET /api/tasks returns friendly authentication required message'
    );

    const unauthPostTask = await makeRequest('/api/tasks', {
      method: 'POST',
      body: { title: 'Secret Task' },
    });
    assert(unauthPostTask.status === 401, 'POST /api/tasks without session returns HTTP 401');

    // -----------------------------------------------------------------------
    // 3. Registration: Validation & Duplicate Email Prevention
    // -----------------------------------------------------------------------
    console.log('\n--- 3. Registration & Validation ---');

    // Test password mismatch
    const mismatchRes = await makeRequest('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Luna Lovegood',
        email: 'luna@bloom.test',
        password: 'password123',
        confirmPassword: 'mismatchedPassword',
      },
    });
    assert(mismatchRes.status === 400, 'Register rejects mismatched passwords with HTTP 400');

    // Test password too short
    const shortPassRes = await makeRequest('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Luna Lovegood',
        email: 'luna@bloom.test',
        password: '123',
        confirmPassword: '123',
      },
    });
    assert(shortPassRes.status === 400, 'Register rejects short passwords (< 6 chars)');

    // Clean up test users if they existed from prior runs
    await User.deleteMany({ email: { $in: ['luna@bloom.test', 'flora@bloom.test'] } });

    // Register User 1 successfully
    const registerUser1 = await makeRequest('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Luna Lovegood',
        email: 'luna@bloom.test',
        password: 'gentlePassword123',
        confirmPassword: 'gentlePassword123',
      },
    });
    assert(registerUser1.status === 201, 'Register User 1 returns HTTP 201 Created');
    assert(registerUser1.json && registerUser1.json.success === true, 'Register User 1 reports success: true');
    assert(registerUser1.setCookie != null, 'Register User 1 issues session cookie');
    let user1Cookie = registerUser1.setCookie;

    // Verify password is NOT stored in plain text in MongoDB
    const storedUser = await User.findOne({ email: 'luna@bloom.test' });
    assert(storedUser != null, 'User 1 is saved in MongoDB');
    assert(storedUser.password !== 'gentlePassword123', 'Password is not stored in plain-text');
    assert(storedUser.password.startsWith('$2'), 'Password is securely hashed with bcrypt ($2a/b)');

    // Test duplicate email registration prevention
    const duplicateRes = await makeRequest('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Luna Duplicate',
        email: 'luna@bloom.test',
        password: 'differentPassword123',
        confirmPassword: 'differentPassword123',
      },
    });
    assert(duplicateRes.status === 400, 'Register rejects duplicate email with HTTP 400');
    assert(
      duplicateRes.json && duplicateRes.json.message.includes('already blooms here'),
      'Duplicate email returns friendly message'
    );

    // -----------------------------------------------------------------------
    // 4. Login: Credential Validation & Session
    // -----------------------------------------------------------------------
    console.log('\n--- 4. Login & Authentication ---');

    // Reject wrong password
    const wrongPassRes = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'luna@bloom.test',
        password: 'wrongPassword999',
      },
    });
    assert(wrongPassRes.status === 401, 'Login rejects incorrect password with HTTP 401');

    // Reject nonexistent user
    const noUserRes = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'nonexistent@bloom.test',
        password: 'anyPassword123',
      },
    });
    assert(noUserRes.status === 401, 'Login rejects non-existent email with HTTP 401');

    // Successful login for User 1
    const loginUser1 = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'luna@bloom.test',
        password: 'gentlePassword123',
      },
    });
    assert(loginUser1.status === 200, 'Login User 1 with correct credentials returns HTTP 200');
    assert(loginUser1.setCookie != null, 'Login returns valid session cookie');
    user1Cookie = loginUser1.setCookie;

    // Check /api/auth/me returns User 1's profile
    const meRes = await makeRequest('/api/auth/me', { cookie: user1Cookie });
    assert(meRes.status === 200 && meRes.json.isAuthenticated === true, 'GET /api/auth/me reports isAuthenticated: true');
    assert(meRes.json.user.name === 'Luna Lovegood', 'GET /api/auth/me returns user name: Luna Lovegood');

    // -----------------------------------------------------------------------
    // 5. User 1 Task Operations (CRUD)
    // -----------------------------------------------------------------------
    console.log('\n--- 5. User 1 Task Management (CRUD) ---');

    // Create Task 1 for User 1
    const task1Res = await makeRequest('/api/tasks', {
      method: 'POST',
      cookie: user1Cookie,
      body: {
        title: 'Water the pink daisies',
        description: 'Give them morning sunlight',
        priority: 'High',
        status: 'To Do',
      },
    });
    assert(task1Res.status === 201, 'User 1 plants task successfully (HTTP 201)');
    const task1Id = task1Res.json.data._id;

    // Read User 1 tasks
    const getTasks1 = await makeRequest('/api/tasks', { cookie: user1Cookie });
    assert(getTasks1.status === 200, 'User 1 retrieves tasks (HTTP 200)');
    const user1TaskIds = getTasks1.json.data.map((t) => t._id);
    assert(user1TaskIds.includes(task1Id), 'User 1 task list contains newly planted task');

    // Update Task 1
    const updateTask1 = await makeRequest(`/api/tasks/${task1Id}`, {
      method: 'PUT',
      cookie: user1Cookie,
      body: {
        title: 'Water the pink daisies & jasmine',
        priority: 'Medium',
      },
    });
    assert(updateTask1.status === 200, 'User 1 updates task (HTTP 200)');
    assert(updateTask1.json.data.title === 'Water the pink daisies & jasmine', 'Task title updated properly');

    // Toggle Task 1 status
    const statusTask1 = await makeRequest(`/api/tasks/${task1Id}/status`, {
      method: 'PATCH',
      cookie: user1Cookie,
      body: { status: 'Completed' },
    });
    assert(statusTask1.status === 200, 'User 1 toggles task status to Completed (HTTP 200)');
    assert(statusTask1.json.data.status === 'Completed', 'Task status is now Completed');

    // -----------------------------------------------------------------------
    // 6. Multi-User Isolation (User 2 Cannot See or Edit User 1 Tasks)
    // -----------------------------------------------------------------------
    console.log('\n--- 6. Multi-User Isolation & Privacy ---');

    // Register User 2: Flora Blossom
    const registerUser2 = await makeRequest('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Flora Blossom',
        email: 'flora@bloom.test',
        password: 'floraPassword456',
        confirmPassword: 'floraPassword456',
      },
    });
    assert(registerUser2.status === 201, 'Register User 2 returns HTTP 201');
    const user2Cookie = registerUser2.setCookie;

    // User 2 gets their tasks: should NOT include User 1's tasks!
    const getTasksUser2 = await makeRequest('/api/tasks', { cookie: user2Cookie });
    assert(getTasksUser2.status === 200, 'User 2 retrieves tasks');
    const user2TaskIds = getTasksUser2.json.data.map((t) => t._id);
    assert(!user2TaskIds.includes(task1Id), 'User 2 CANNOT see User 1 tasks (privacy verified)');

    // User 2 attempts to read User 1 task directly by ID -> must return 404
    const user2GetTask1 = await makeRequest(`/api/tasks/${task1Id}`, { cookie: user2Cookie });
    assert(user2GetTask1.status === 404, 'User 2 GET User 1 task ID returns 404 Not Found');

    // User 2 attempts to update User 1 task by ID -> must return 404
    const user2UpdateTask1 = await makeRequest(`/api/tasks/${task1Id}`, {
      method: 'PUT',
      cookie: user2Cookie,
      body: { title: 'Hacked by User 2!' },
    });
    assert(user2UpdateTask1.status === 404, 'User 2 cannot update User 1 task (HTTP 404)');

    // User 2 attempts to delete User 1 task by ID -> must return 404
    const user2DeleteTask1 = await makeRequest(`/api/tasks/${task1Id}`, {
      method: 'DELETE',
      cookie: user2Cookie,
    });
    assert(user2DeleteTask1.status === 404, 'User 2 cannot delete User 1 task (HTTP 404)');

    // Verify User 1's task is still intact
    const verifyTask1 = await makeRequest(`/api/tasks/${task1Id}`, { cookie: user1Cookie });
    assert(
      verifyTask1.status === 200 && verifyTask1.json.data.title === 'Water the pink daisies & jasmine',
      'User 1 task remains safe, uncorrupted, and intact'
    );

    // -----------------------------------------------------------------------
    // 7. Logout & Session Invalidation
    // -----------------------------------------------------------------------
    console.log('\n--- 7. Logout & Session Destruction ---');

    const logoutRes = await makeRequest('/api/auth/logout', {
      method: 'POST',
      cookie: user1Cookie,
    });
    assert(logoutRes.status === 200, 'POST /api/auth/logout returns HTTP 200');
    assert(logoutRes.json.success === true, 'Logout reports success: true');

    // Requesting tasks with destroyed cookie must return 401
    const postLogoutTasks = await makeRequest('/api/tasks', { cookie: user1Cookie });
    assert(postLogoutTasks.status === 401, 'Request with logged-out session returns HTTP 401');

    // User 1 logs back in again
    const reLogin = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'luna@bloom.test',
        password: 'gentlePassword123',
      },
    });
    assert(reLogin.status === 200, 'User 1 logs back in successfully');
    const newSessionCookie = reLogin.setCookie;

    // Verify tasks are still there for User 1
    const getReLoginTasks = await makeRequest('/api/tasks', { cookie: newSessionCookie });
    assert(
      getReLoginTasks.status === 200 && getReLoginTasks.json.data.some((t) => t._id === task1Id),
      'User 1 tasks persist across logout and re-login'
    );

    console.log(`\n🌿 Full-Stack Verification Complete: ${passed} passed, ${failed} failed.\n`);
  } catch (err) {
    console.error('❌ Test execution error:', err);
    failed++;
  } finally {
    testServer.close();
    // Do not wipe DB - keep existing tasks for user
    await mongoose.disconnect().catch(() => {});
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
