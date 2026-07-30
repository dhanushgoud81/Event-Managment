import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Helper for HTTP requests
const api = axios.create({
  baseURL: API_URL,
  validateStatus: () => true, // Don't throw on HTTP error statuses
});

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function logHeader(title: string) {
  console.log(`\n${colors.bright}${colors.cyan}====================================================`);
  console.log(` ${title}`);
  console.log(`====================================================${colors.reset}`);
}

function logTest(name: string, passed: boolean, details?: string) {
  const symbol = passed ? `${colors.green}✓ PASS` : `${colors.red}✗ FAIL`;
  console.log(`${symbol}${colors.reset} - ${colors.bright}${name}${colors.reset}`);
  if (details) {
    console.log(`   ${colors.yellow}${details}${colors.reset}`);
  }
}

interface TestUser {
  id: string;
  email: string;
  token: string;
  referralCode: string;
}

// Generate unique test user
let userCount = 0;
async function createTestUser(): Promise<TestUser> {
  userCount++;
  const timestamp = Date.now().toString().slice(-6);
  const email = `testuser_${timestamp}_${userCount}_${Math.random().toString(36).substring(7)}@test.com`;
  const password = 'Password@123';
  const firstName = `Test${userCount}`;
  const lastName = `User`;

  const regRes = await api.post('/auth/register', {
    email,
    password,
    confirmPassword: password,
    firstName,
    lastName,
  });

  if (regRes.status !== 201) {
    throw new Error(`Failed to register user ${email}: ${JSON.stringify(regRes.data)}`);
  }

  // Login to get access token
  const loginRes = await api.post('/auth/login', {
    email,
    password,
  });

  if (loginRes.status !== 200) {
    throw new Error(`Failed to login user ${email}: ${JSON.stringify(loginRes.data)}`);
  }

  const { accessToken, user } = loginRes.data.data;

  return {
    id: user.id,
    email,
    token: accessToken,
    referralCode: user.referralCode,
  };
}

// Admin login
async function getAdminToken(): Promise<string> {
  const loginRes = await api.post('/auth/login', {
    email: 'admin@eventmanagement.com',
    password: 'Admin@123456',
  });

  if (loginRes.status !== 200) {
    throw new Error(`Failed to login admin: ${JSON.stringify(loginRes.data)}`);
  }

  return loginRes.data.data.accessToken;
}

// Create Event Helper
async function createEvent(
  adminToken: string,
  eventConfig: {
    name: string;
    referralRewardType: 'FIXED' | 'PERCENTAGE';
    referralRewardValue: number;
    maxReferralDiscountPercent: number;
    ticketPrice?: number;
    vipPrice?: number;
  }
) {
  const slug = `event-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const now = new Date();
  const startDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const endDate = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString();
  const regStartDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();
  const regEndDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString();

  const eventRes = await api.post(
    '/events',
    {
      name: eventConfig.name,
      description: `Test event for referral matrix verification`,
      venue: 'Test Virtual Hall',
      startDate,
      endDate,
      regStartDate,
      regEndDate,
      maxParticipants: 500,
      referralRewardType: eventConfig.referralRewardType,
      referralRewardValue: eventConfig.referralRewardValue,
      maxReferralDiscountPercent: eventConfig.maxReferralDiscountPercent,
    },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );

  if (eventRes.status !== 201) {
    throw new Error(`Failed to create event ${eventConfig.name}: ${JSON.stringify(eventRes.data)}`);
  }

  const eventId = eventRes.data.data.id;

  // Add Ticket Category (Standard) FIRST before publishing
  const ticketPrice = eventConfig.ticketPrice ?? 100;
  const ticketRes = await api.post(
    `/events/${eventId}/tickets`,
    {
      name: 'Standard Ticket',
      price: ticketPrice,
      maxQuantity: 500,
      saleStart: regStartDate,
      saleEnd: regEndDate,
    },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );

  const standardTicketId = ticketRes.data.data.id;
  let vipTicketId: string | undefined;

  if (eventConfig.vipPrice) {
    const vipRes = await api.post(
      `/events/${eventId}/tickets`,
      {
        name: 'VIP Ticket',
        price: eventConfig.vipPrice,
        maxQuantity: 100,
        saleStart: regStartDate,
        saleEnd: regEndDate,
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    vipTicketId = vipRes.data.data.id;
  }

  // Publish Event AFTER adding ticket categories
  const pubRes = await api.patch(
    `/events/${eventId}/status`,
    { status: 'PUBLISHED' },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );

  if (pubRes.status !== 200) {
    throw new Error(`Failed to publish event ${eventId}: ${JSON.stringify(pubRes.data)}`);
  }

  return {
    id: eventId,
    name: eventConfig.name,
    standardTicketId,
    vipTicketId,
  };
}

// Register user for event helper
async function registerUserForEvent(
  user: TestUser,
  eventId: string,
  ticketCategoryId: string,
  referralCode?: string
) {
  const res = await api.post(
    '/registrations',
    {
      eventId,
      ticketCategoryId,
      referralCode,
      responses: [],
    },
    { headers: { Authorization: `Bearer ${user.token}` } }
  );
  if (res.status !== 201) {
    console.error(`Registration error (${res.status}):`, JSON.stringify(res.data));
  }
  return res;
}

// Pay for registration helper (Order + Verify)
async function processPaymentForUser(user: TestUser, registrationId: string) {
  // Create Order
  const orderRes = await api.post(
    '/payments/orders',
    { registrationId },
    { headers: { Authorization: `Bearer ${user.token}` } }
  );

  if (orderRes.status !== 201 && orderRes.status !== 200) {
    return { orderRes, verifyRes: null };
  }

  const { cashfreeOrderId, isFreeWithDiscount } = orderRes.data.data;

  if (isFreeWithDiscount) {
    return { orderRes, verifyRes: { status: 200, data: { success: true, isFree: true } } };
  }

  // Verify Order with simulated test mock pay header
  const verifyRes = await api.post(
    '/payments/verify',
    { cashfreeOrderId, registrationId },
    {
      headers: {
        Authorization: `Bearer ${user.token}`,
        'x-test-mock-pay': 'true',
      },
    }
  );

  return { orderRes, verifyRes };
}

// Structure to store test execution report
const reportLogs: Array<{ test: string; passed: boolean; details: string; cashfreeUrl?: string }> = [];

async function main() {
  console.log(`${colors.bright}${colors.green}Starting Comprehensive Referral Discount Test Suite...${colors.reset}`);
  const adminToken = await getAdminToken();

  // Enable global referral program
  await api.put(
    '/referrals/settings',
    { isActive: true, rewardAmount: 50 },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );

  // =========================================================================
  // REQUIREMENT 1: Create 4 Events with different referral configurations
  // =========================================================================
  logHeader('REQUIREMENT 1: Creating 4 Events with Specific Referral Settings');

  const eventA = await createEvent(adminToken, {
    name: 'Event A (Fixed ₹20, Max 50% Cap)',
    referralRewardType: 'FIXED',
    referralRewardValue: 20,
    maxReferralDiscountPercent: 50,
    ticketPrice: 100,
  });
  console.log(`Event A Created ID: ${eventA.id}`);

  const eventB = await createEvent(adminToken, {
    name: 'Event B (Percentage 25%, Max 100% Cap)',
    referralRewardType: 'PERCENTAGE',
    referralRewardValue: 25,
    maxReferralDiscountPercent: 100,
    ticketPrice: 100,
  });
  console.log(`Event B Created ID: ${eventB.id}`);

  const eventC = await createEvent(adminToken, {
    name: 'Event C (Fixed ₹100, Max 0% Cap)',
    referralRewardType: 'FIXED',
    referralRewardValue: 100,
    maxReferralDiscountPercent: 0,
    ticketPrice: 100,
  });
  console.log(`Event C Created ID: ${eventC.id}`);

  const eventD = await createEvent(adminToken, {
    name: 'Event D (Percentage 50%, Max 30% Cap)',
    referralRewardType: 'PERCENTAGE',
    referralRewardValue: 50,
    maxReferralDiscountPercent: 30,
    ticketPrice: 100,
    vipPrice: 200,
  });
  console.log(`Event D Created ID: ${eventD.id}`);

  // =========================================================================
  // REQUIREMENT 2: 5 Regular Test Cases
  // =========================================================================
  logHeader('REQUIREMENT 2: Running 5 Regular Test Cases');

  // REGULAR CASE 1: Single referrer bringing 1 user
  {
    const testName = 'Regular 1: Single referrer bringing 1 user';
    const R1 = await createTestUser();
    const U1 = await createTestUser();

    // R1 registers for Event A and pays
    const r1Reg = await registerUserForEvent(R1, eventA.id, eventA.standardTicketId);
    await processPaymentForUser(R1, r1Reg.data.data.id);

    // U1 registers for Event A with R1's referral code and pays
    const u1Reg = await registerUserForEvent(U1, eventA.id, eventA.standardTicketId, R1.referralCode);
    await processPaymentForUser(U1, u1Reg.data.data.id);

    // Now R1 creates another payment order or checks discount applied
    // (Note: R1 already paid for first ticket, but let's test R1 registering for a new registration or creating order)
    const R1_2 = await createTestUser(); // Or R1 registering for another event or same event if allowed
    // Let's have R1_ref register & pay first, THEN R1 registers and checks discount:
    const R1_test = await createTestUser();
    const R1_reg = await registerUserForEvent(R1_test, eventA.id, eventA.standardTicketId);
    const U1_test = await createTestUser();
    const U1_reg = await registerUserForEvent(U1_test, eventA.id, eventA.standardTicketId, R1_test.referralCode);
    await processPaymentForUser(U1_test, U1_reg.data.data.id);

    const { orderRes } = await processPaymentForUser(R1_test, R1_reg.data.data.id);
    const data = orderRes.data.data;
    const passed =
      (orderRes.status === 200 || orderRes.status === 201) &&
      data.originalPrice === 100 &&
      data.referralDiscountApplied === 20 &&
      data.amount === 80;

    const details = `Original: ₹${data?.originalPrice}, Discount: ₹${data?.referralDiscountApplied}, Final: ₹${data?.amount}, OrderId: ${data?.cashfreeOrderId}`;
    logTest(testName, passed, details);
    reportLogs.push({ test: testName, passed, details, cashfreeUrl: data?.cashfreeOrderId });
  }

  // REGULAR CASE 2: Single referrer bringing 2 users to build cumulative discount
  {
    const testName = 'Regular 2: Single referrer bringing 2 users (cumulative discount)';
    const R2 = await createTestUser();
    const r2Reg = await registerUserForEvent(R2, eventA.id, eventA.standardTicketId);

    const U2A = await createTestUser();
    const u2aReg = await registerUserForEvent(U2A, eventA.id, eventA.standardTicketId, R2.referralCode);
    await processPaymentForUser(U2A, u2aReg.data.data.id);

    const U2B = await createTestUser();
    const u2bReg = await registerUserForEvent(U2B, eventA.id, eventA.standardTicketId, R2.referralCode);
    await processPaymentForUser(U2B, u2bReg.data.data.id);

    const { orderRes } = await processPaymentForUser(R2, r2Reg.data.data.id);
    const data = orderRes.data.data;
    const passed =
      (orderRes.status === 200 || orderRes.status === 201) &&
      data.originalPrice === 100 &&
      data.referralDiscountApplied === 40 &&
      data.amount === 60;

    const details = `Original: ₹${data?.originalPrice}, Cumulative Discount: ₹${data?.referralDiscountApplied} (2x ₹20), Final: ₹${data?.amount}`;
    logTest(testName, passed, details);
    reportLogs.push({ test: testName, passed, details, cashfreeUrl: data?.cashfreeOrderId });
  }

  // REGULAR CASE 3: Referrer with max discount cap reached (e.g. capped at 50%)
  {
    const testName = 'Regular 3: Referrer with max discount cap reached (50% cap on Event A)';
    const R3 = await createTestUser();
    const r3Reg = await registerUserForEvent(R3, eventA.id, eventA.standardTicketId);

    // Bring 3 users (3 x ₹20 = ₹60 earned, but max cap is 50% of ₹100 = ₹50)
    for (let i = 0; i < 3; i++) {
      const U = await createTestUser();
      const reg = await registerUserForEvent(U, eventA.id, eventA.standardTicketId, R3.referralCode);
      await processPaymentForUser(U, reg.data.data.id);
    }

    const { orderRes } = await processPaymentForUser(R3, r3Reg.data.data.id);
    const data = orderRes.data.data;
    const passed =
      (orderRes.status === 200 || orderRes.status === 201) &&
      data.originalPrice === 100 &&
      data.referralDiscountApplied === 50 &&
      data.amount === 50;

    const details = `Earned ₹60, Capped at Max 50% (₹50). Final Payable: ₹${data?.amount}`;
    logTest(testName, passed, details);
    reportLogs.push({ test: testName, passed, details, cashfreeUrl: data?.cashfreeOrderId });
  }

  // REGULAR CASE 4: Free event ticket result when 100% discount cap is reached
  {
    const testName = 'Regular 4: Free event ticket result when 100% discount cap is reached';
    const R4 = await createTestUser();
    const r4Reg = await registerUserForEvent(R4, eventB.id, eventB.standardTicketId);

    // Event B: 25% reward per referral, 100% max cap. 4 users = 100% discount.
    for (let i = 0; i < 4; i++) {
      const U = await createTestUser();
      const reg = await registerUserForEvent(U, eventB.id, eventB.standardTicketId, R4.referralCode);
      await processPaymentForUser(U, reg.data.data.id);
    }

    const { orderRes } = await processPaymentForUser(R4, r4Reg.data.data.id);
    const data = orderRes.data.data;
    const passed =
      orderRes.status === 200 &&
      data.amount === 0 &&
      data.isFreeWithDiscount === true;

    const details = `Payable Amount: ₹${data?.amount}, Auto-Confirmed Free Ticket: ${data?.isFreeWithDiscount}`;
    logTest(testName, passed, details);
    reportLogs.push({ test: testName, passed, details, cashfreeUrl: data?.cashfreeOrderId });
  }

  // REGULAR CASE 5: Separate events where user A refers user B in Event 1, but cannot use that discount for Event 2
  {
    const testName = 'Regular 5: Referral discount is strictly event-scoped (Event 1 discount not valid for Event 2)';
    const R5 = await createTestUser();

    // R5 registers for Event A & brings U5 for Event A
    const r5RegA = await registerUserForEvent(R5, eventA.id, eventA.standardTicketId);
    const U5 = await createTestUser();
    const u5RegA = await registerUserForEvent(U5, eventA.id, eventA.standardTicketId, R5.referralCode);
    await processPaymentForUser(U5, u5RegA.data.data.id);

    // R5 registers for Event B (where R5 has earned no referrals)
    const r5RegB = await registerUserForEvent(R5, eventB.id, eventB.standardTicketId);
    const { orderRes } = await processPaymentForUser(R5, r5RegB.data.data.id);
    const data = orderRes.data.data;

    const passed =
      (orderRes.status === 200 || orderRes.status === 201) &&
      data.referralDiscountApplied === 0 &&
      data.amount === 100;

    const details = `Event B Ticket Price: ₹100, Applied Discount from Event A: ₹${data?.referralDiscountApplied}, Payable: ₹${data?.amount}`;
    logTest(testName, passed, details);
    reportLogs.push({ test: testName, passed, details, cashfreeUrl: data?.cashfreeOrderId });
  }

  // =========================================================================
  // REQUIREMENT 3: 10 Edge Test Cases
  // =========================================================================
  logHeader('REQUIREMENT 3: Running 10 Edge Test Cases');

  // EDGE CASE 1: Self-referral attempt (User A using User A's referral code)
  {
    const testName = 'Edge 1: Self-referral attempt rejected';
    const UA = await createTestUser();

    // Try apply API
    const applyRes = await api.post(
      '/referrals/apply',
      { referralCode: UA.referralCode },
      { headers: { Authorization: `Bearer ${UA.token}` } }
    );

    // Try register with self code
    const regRes = await registerUserForEvent(UA, eventA.id, eventA.standardTicketId, UA.referralCode);
    const { orderRes } = await processPaymentForUser(UA, regRes.data.data.id);

    const passed =
      applyRes.status === 400 &&
      applyRes.data.message.includes('cannot refer yourself') &&
      orderRes.data.data.referralDiscountApplied === 0;

    const details = `Apply response: ${applyRes.data.message}, Self-Discount: ₹${orderRes.data.data.referralDiscountApplied}`;
    logTest(testName, passed, details);
    reportLogs.push({ test: testName, passed, details });
  }

  // EDGE CASE 2: Unregistered referrer (User A trying to refer User B without having registered for the event)
  {
    const testName = 'Edge 2: Unregistered referrer cannot give referral discount';
    const ReferrerNotReg = await createTestUser();
    const ReferredUser = await createTestUser();

    // ReferredUser registers for Event A using ReferrerNotReg's referral code (ReferrerNotReg is NOT registered for Event A)
    const refReg = await registerUserForEvent(ReferredUser, eventA.id, eventA.standardTicketId, ReferrerNotReg.referralCode);
    await processPaymentForUser(ReferredUser, refReg.data.data.id);

    // NOW ReferrerNotReg registers for Event A
    const referrerReg = await registerUserForEvent(ReferrerNotReg, eventA.id, eventA.standardTicketId);
    const { orderRes } = await processPaymentForUser(ReferrerNotReg, referrerReg.data.data.id);
    const data = orderRes.data.data;

    const passed = data.referralDiscountApplied === 0 && data.amount === 100;
    const details = `Referrer Discount Applied: ₹${data?.referralDiscountApplied}, Payable: ₹${data?.amount}`;
    logTest(testName, passed, details);
    reportLogs.push({ test: testName, passed, details, cashfreeUrl: data?.cashfreeOrderId });
  }

  // EDGE CASE 3: Invalid / Non-existent referral code
  {
    const testName = 'Edge 3: Invalid / Non-existent referral code validation';
    const UserEdge3 = await createTestUser();

    const applyRes = await api.post(
      '/referrals/apply',
      { referralCode: 'INVALID8' },
      { headers: { Authorization: `Bearer ${UserEdge3.token}` } }
    );

    const regRes = await registerUserForEvent(UserEdge3, eventA.id, eventA.standardTicketId, 'INVALID8');
    const { orderRes } = await processPaymentForUser(UserEdge3, regRes.data.data.id);

    const passed =
      applyRes.status === 404 &&
      regRes.status === 201 &&
      orderRes.data.data.referralDiscountApplied === 0;

    const details = `Apply status: ${applyRes.status} (Not Found), Registration succeeded safely with 0 discount.`;
    logTest(testName, passed, details);
    reportLogs.push({ test: testName, passed, details });
  }

  // EDGE CASE 4: Referrer registering AFTER referred user
  {
    const testName = 'Edge 4: Referrer registering AFTER referred user';
    const ReferrerLate = await createTestUser();
    const ReferredEarly = await createTestUser();

    // Referred Early registers BEFORE Referrer Late registers for Event A
    const earlyReg = await registerUserForEvent(ReferredEarly, eventA.id, eventA.standardTicketId, ReferrerLate.referralCode);
    await processPaymentForUser(ReferredEarly, earlyReg.data.data.id);

    // Later, Referrer Late registers
    const lateReg = await registerUserForEvent(ReferrerLate, eventA.id, eventA.standardTicketId);
    const { orderRes } = await processPaymentForUser(ReferrerLate, lateReg.data.data.id);
    const data = orderRes.data.data;

    const passed = data.referralDiscountApplied === 0 && data.amount === 100;
    const details = `Discount for late-registering referrer: ₹${data?.referralDiscountApplied}, Payable: ₹${data?.amount}`;
    logTest(testName, passed, details);
    reportLogs.push({ test: testName, passed, details, cashfreeUrl: data?.cashfreeOrderId });
  }

  // EDGE CASE 5: Referrer with CANCELLED registration trying to give referral discounts
  {
    const testName = 'Edge 5: Referrer with CANCELLED registration cannot give referral discounts';
    const ReferrerCancel = await createTestUser();

    // Register for Event A
    const rCancelReg = await registerUserForEvent(ReferrerCancel, eventA.id, eventA.standardTicketId);
    const regId = rCancelReg.data.data.id;

    // Admin cancels ReferrerCancel's registration directly in DB or via status update if available
    // Let's update via prisma/DB query or API
    // We can use a direct call or standard update:
    // Let's cancel registration via database directly or admin API
    await api.post(
      '/auth/login',
      { email: ReferrerCancel.email, password: 'Password@123' }
    );
    
    // Cancel registration via prisma endpoint / update
    // Let's register referred user while referrer status is CANCELLED:
    // We can simulate cancelled status by updating DB via direct script or test hook if needed,
    // or let's test CANCELLED status:
    const U_CancelRef = await createTestUser();
    
    // Update regId status to CANCELLED via API or Prisma if admin endpoint available
    // Let's inspect if admin registration status update endpoint exists or update via DB:
    // Let's cancel it by updating registration status directly using prisma helper in node script
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.registration.update({
      where: { id: regId },
      data: { status: 'CANCELLED' },
    });

    // Now Referred user registers with ReferrerCancel's referral code
    const uCancelReg = await registerUserForEvent(U_CancelRef, eventA.id, eventA.standardTicketId, ReferrerCancel.referralCode);
    await processPaymentForUser(U_CancelRef, uCancelReg.data.data.id);

    // Re-enable ReferrerCancel's registration to CONFIRMED
    await prisma.registration.update({
      where: { id: regId },
      data: { status: 'PENDING' },
    });

    const { orderRes } = await processPaymentForUser(ReferrerCancel, regId);
    const data = orderRes.data.data;
    await prisma.$disconnect();

    const passed = data.referralDiscountApplied === 0 && data.amount === 100;
    const details = `Referrer had CANCELLED status when user registered -> Discount Given: ₹${data?.referralDiscountApplied}`;
    logTest(testName, passed, details);
    reportLogs.push({ test: testName, passed, details, cashfreeUrl: data?.cashfreeOrderId });
  }

  // EDGE CASE 6: Multiple referrals accumulating over ticket base price (verify min price is 0)
  {
    const testName = 'Edge 6: Multiple referrals accumulating over ticket base price (min price is 0)';
    const R_Excess = await createTestUser();
    const rExcessReg = await registerUserForEvent(R_Excess, eventB.id, eventB.standardTicketId);

    // Event B ticket price = ₹100, 25% reward (₹25). Bring 5 users (5 x ₹25 = ₹125 total earned)
    for (let i = 0; i < 5; i++) {
      const U = await createTestUser();
      const reg = await registerUserForEvent(U, eventB.id, eventB.standardTicketId, R_Excess.referralCode);
      await processPaymentForUser(U, reg.data.data.id);
    }

    const { orderRes } = await processPaymentForUser(R_Excess, rExcessReg.data.data.id);
    const data = orderRes.data.data;

    const passed = orderRes.status === 200 && data.amount === 0;
    const details = `Earned ₹125 on ₹100 ticket -> Final Price: ₹${data?.amount} (Bounded to min 0)`;
    logTest(testName, passed, details);
    reportLogs.push({ test: testName, passed, details });
  }

  // EDGE CASE 7: 0% max discount cap event (verify discount is forced to 0)
  {
    const testName = 'Edge 7: 0% max discount cap event forces discount to 0';
    const R_Cap0 = await createTestUser();
    const rCap0Reg = await registerUserForEvent(R_Cap0, eventC.id, eventC.standardTicketId);

    // Event C has ₹100 reward, but 0% max discount cap
    const U_Cap0 = await createTestUser();
    const uCap0Reg = await registerUserForEvent(U_Cap0, eventC.id, eventC.standardTicketId, R_Cap0.referralCode);
    await processPaymentForUser(U_Cap0, uCap0Reg.data.data.id);

    const { orderRes } = await processPaymentForUser(R_Cap0, rCap0Reg.data.data.id);
    const data = orderRes.data.data;

    const passed =
      (orderRes.status === 200 || orderRes.status === 201) &&
      data.originalPrice === 100 &&
      data.referralDiscountApplied === 0 &&
      data.amount === 100;

    const details = `Earned ₹100, Event Max Cap 0% -> Applied Discount: ₹${data?.referralDiscountApplied}, Final: ₹${data?.amount}`;
    logTest(testName, passed, details);
    reportLogs.push({ test: testName, passed, details, cashfreeUrl: data?.cashfreeOrderId });
  }

  // EDGE CASE 8: 100% discount cap event leading to auto-confirmation (0 payable amount)
  {
    const testName = 'Edge 8: 100% discount cap event leading to auto-confirmation';
    const R_Auto = await createTestUser();
    const rAutoReg = await registerUserForEvent(R_Auto, eventB.id, eventB.standardTicketId);

    // Bring 4 users to reach 100% discount
    for (let i = 0; i < 4; i++) {
      const U = await createTestUser();
      const reg = await registerUserForEvent(U, eventB.id, eventB.standardTicketId, R_Auto.referralCode);
      await processPaymentForUser(U, reg.data.data.id);
    }

    const { orderRes } = await processPaymentForUser(R_Auto, rAutoReg.data.data.id);
    const data = orderRes.data.data;

    const passed =
      orderRes.status === 200 &&
      data.amount === 0 &&
      data.paymentSessionId === 'free' &&
      data.isFreeWithDiscount === true;

    const details = `Session: ${data?.paymentSessionId}, Amount: ₹${data?.amount}, Auto-Confirmed Ticket`;
    logTest(testName, passed, details);
    reportLogs.push({ test: testName, passed, details });
  }

  // EDGE CASE 9: Percentage reward on variable ticket prices (verify percentage calculation)
  {
    const testName = 'Edge 9: Percentage reward on variable ticket prices (50% reward on VIP ticket, 30% max cap on Standard)';
    const R_Var = await createTestUser();

    // Referrer R_Var registers for Standard Ticket (₹100) in Event D
    const rVarReg = await registerUserForEvent(R_Var, eventD.id, eventD.standardTicketId);

    // User U_VIP registers for VIP Ticket (₹200) in Event D using R_Var's code and pays
    const U_VIP = await createTestUser();
    const uVipReg = await registerUserForEvent(U_VIP, eventD.id, eventD.vipTicketId!, R_Var.referralCode);
    await processPaymentForUser(U_VIP, uVipReg.data.data.id);

    // 50% reward on VIP ticket (₹200) = ₹100 earned.
    // Referrer's Standard Ticket price = ₹100. Event D max discount cap = 30%.
    // Max allowed discount on ₹100 ticket = 30% of ₹100 = ₹30.
    const { orderRes } = await processPaymentForUser(R_Var, rVarReg.data.data.id);
    const data = orderRes.data.data;

    const passed =
      (orderRes.status === 200 || orderRes.status === 201) &&
      data.originalPrice === 100 &&
      data.referralDiscountApplied === 30 &&
      data.amount === 70;

    const details = `VIP Ticket Purchased: ₹200 -> Reward: 50% (₹100). Standard Ticket: ₹100 -> Capped at 30% (₹30). Payable: ₹${data?.amount}`;
    logTest(testName, passed, details);
    reportLogs.push({ test: testName, passed, details, cashfreeUrl: data?.cashfreeOrderId });
  }

  // EDGE CASE 10: Cross-event referral code usage
  {
    const testName = 'Edge 10: Cross-event referral code usage (Referrer registered for Event A, used for Event B signup)';
    const R_Cross = await createTestUser();

    // R_Cross registers for Event A ONLY
    await registerUserForEvent(R_Cross, eventA.id, eventA.standardTicketId);

    // User U_Cross registers for Event B using R_Cross's referral code
    const U_Cross = await createTestUser();
    const uCrossReg = await registerUserForEvent(U_Cross, eventB.id, eventB.standardTicketId, R_Cross.referralCode);
    await processPaymentForUser(U_Cross, uCrossReg.data.data.id);

    // R_Cross now registers for Event B
    const rCrossRegB = await registerUserForEvent(R_Cross, eventB.id, eventB.standardTicketId);
    const { orderRes } = await processPaymentForUser(R_Cross, rCrossRegB.data.data.id);
    const data = orderRes.data.data;

    const passed =
      (orderRes.status === 200 || orderRes.status === 201) &&
      data.referralDiscountApplied === 0 &&
      data.amount === 100;

    const details = `Cross-Event Referral attempt -> Applied Discount: ₹${data?.referralDiscountApplied}, Final Payable: ₹${data?.amount}`;
    logTest(testName, passed, details);
    reportLogs.push({ test: testName, passed, details, cashfreeUrl: data?.cashfreeOrderId });
  }

  // Summary Report
  logHeader('TEST MATRIX SUMMARY REPORT');
  const passedCount = reportLogs.filter((r) => r.passed).length;
  console.log(`${colors.bright}Total Executed Tests: ${reportLogs.length}`);
  console.log(`${colors.green}Passed: ${passedCount}`);
  console.log(`${colors.red}Failed: ${reportLogs.length - passedCount}${colors.reset}\n`);

  if (passedCount === reportLogs.length) {
    console.log(`${colors.bright}${colors.green}ALL 15 TEST MATRIX CASES PASSED SUCCESSFULLY!${colors.reset}\n`);
  } else {
    console.error(`${colors.bright}${colors.red}SOME TEST CASES FAILED.${colors.reset}\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
