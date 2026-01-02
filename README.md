# Narrativee

## **What We Do**
Narrativee helps small/mid SaaS companies increase trial-to-paid conversions by tracking 'Aha moments', scoring trial users intent in real-time, and automating the right nudges to increase activation.

---

## **Positioning**
> "Narrativee shows you which trial users will convert—and why—so you can maximize your ROI."

---

## **Our Job**
> Guide trial users to activation moments fast, and pressure-test intent before the trial ends.

---

## **The Problem We Solve**
> Mid-sized SaaS companies leave significant revenue on the table because trial users never reach the "aha" moment before their trial ends.

**Why this happens:**
- Trial users get lost exploring features without direction
- SaaS owners can't see who's engaged vs. who's a tourist
- No one knows *when* to nudge a user or ask for the upgrade
- Activation moments aren't defined, tracked, or optimized

---

## **Architecture Decision: Component Management**

### **How Components Work (V0.1)**

**We chose: Users create components in OUR app, we inject them into theirs**

#### **Why this approach:**
- ✅ No code needed after initial SDK setup
- ✅ Change popups/emails without redeploying their app
- ✅ One dashboard to manage everything
- ✅ Works for non-technical founders
- ✅ We control UX quality and consistency

#### **Implementation:**

**1. One-time SDK installation:**
```javascript
// Founders add this script to their app once
<script src="https://narrativee.com/sdk.js" data-api-key="YOUR_API_KEY"></script>
```

**2. Component creation in Narrativee dashboard:**
- Visual popup builder (drag-drop or form-based)
- Email template editor
- Workflow condition setup (e.g., "points > 60")
- Preview mode for testing

**3. Our SDK handles:**
- Tracking user behavior and calculating engagement scores
- Fetching workflows and checking conditions
- Injecting popups when conditions are met
- Triggering email campaigns via our backend
- Real-time analytics and reporting

#### **Technical Flow:**
```
User behavior in app → SDK tracks → Score updates → 
Condition met (e.g., 60 points) → SDK fetches component → 
Injects CTA popup → User converts
```

#### **Inspiration:**
Similar to Intercom, Appcues, or Pendo—install once, manage everything from our dashboard.

---

## **Getting Started**

### **For SaaS Founders:**
1. Sign up and define your "aha moments"
2. Install our SDK in your app
3. Create workflows and design CTAs/emails in the dashboard
4. Watch your trial-to-paid conversion rates climb



---

## **Roadmap**
- [ ] V0.1: Basic workflow engine with CTA popups and email triggers
- [ ] V0.2: A/B testing for different nudges
- [ ] V0.3: AI-powered "aha moment" detection
- [ ] V0.4: Multi-channel support (SMS, Slack, in-app messages)

---

## **Contact**
Questions? Feedback? Reach out at [your email] or open an issue.