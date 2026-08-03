// Business logic to check if a session can be joined (within 5 minutes of scheduled time)
function checkCanJoinSession(scheduledDate, nowMs) {
  const sessionDate = new Date(scheduledDate);
  const canJoinTime = new Date(sessionDate.getTime() - 5 * 60 * 1000);
  const diffMs = canJoinTime.getTime() - nowMs;
  
  if (diffMs > 0) {
    const diffMins = Math.ceil(diffMs / (60 * 1000));
    return {
      canJoin: false,
      message: `You can join this session starting 5 minutes before the scheduled time. Please wait ${diffMins} minute(s).`,
      waitMs: diffMs
    };
  }
  
  return {
    canJoin: true,
    message: "Welcome to the video interview lobby!"
  };
}

// Test cases
function runTests() {
  console.log("=== Testing 5-Minute Session Join Constraint Logic ===\n");

  const now = Date.now();

  // Test Case 1: Session is 10 minutes in the future (Should be BLOCKED)
  const tenMinsFuture = new Date(now + 10 * 60 * 1000).toISOString();
  const tc1 = checkCanJoinSession(tenMinsFuture, now);
  console.log(`[Test 1] Session scheduled in 10 minutes:`);
  console.log(` -> Expected: Blocked (Wait 5 minutes)`);
  console.log(` -> Received: ${tc1.canJoin ? "Allowed" : "Blocked"}`);
  console.log(` -> Message:  "${tc1.message}"`);
  if (!tc1.canJoin && Math.round(tc1.waitMs / 60000) === 5) {
    console.log(" -> Result:   ✅ PASS\n");
  } else {
    console.log(" -> Result:   ❌ FAIL\n");
  }

  // Test Case 2: Session is 5 minutes in the future (Should be ALLOWED)
  const fiveMinsFuture = new Date(now + 5 * 60 * 1000).toISOString();
  const tc2 = checkCanJoinSession(fiveMinsFuture, now);
  console.log(`[Test 2] Session scheduled in 5 minutes:`);
  console.log(` -> Expected: Allowed`);
  console.log(` -> Received: ${tc2.canJoin ? "Allowed" : "Blocked"}`);
  if (tc2.canJoin) {
    console.log(" -> Result:   ✅ PASS\n");
  } else {
    console.log(" -> Result:   ❌ FAIL\n");
  }

  // Test Case 3: Session is 2 minutes in the future (Should be ALLOWED)
  const twoMinsFuture = new Date(now + 2 * 60 * 1000).toISOString();
  const tc3 = checkCanJoinSession(twoMinsFuture, now);
  console.log(`[Test 3] Session scheduled in 2 minutes:`);
  console.log(` -> Expected: Allowed`);
  console.log(` -> Received: ${tc3.canJoin ? "Allowed" : "Blocked"}`);
  if (tc3.canJoin) {
    console.log(" -> Result:   ✅ PASS\n");
  } else {
    console.log(" -> Result:   ❌ FAIL\n");
  }

  // Test Case 4: Session is currently starting right now (Should be ALLOWED)
  const startingNow = new Date(now).toISOString();
  const tc4 = checkCanJoinSession(startingNow, now);
  console.log(`[Test 4] Session starting now:`);
  console.log(` -> Expected: Allowed`);
  console.log(` -> Received: ${tc4.canJoin ? "Allowed" : "Blocked"}`);
  if (tc4.canJoin) {
    console.log(" -> Result:   ✅ PASS\n");
  } else {
    console.log(" -> Result:   ❌ FAIL\n");
  }
}

runTests();
