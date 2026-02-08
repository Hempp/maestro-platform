/**
 * MILESTONE DEFINITIONS
 * Hardcoded milestone data for each path
 */

export interface Milestone {
  number: number;
  title: string;
  goal: string;
  chatbotPrompt: string;
  completionCriteria: string[];
  validationFocus: string;
}

export const OWNER_MILESTONES: Milestone[] = [
  {
    number: 1,
    title: 'The Automation Audit',
    goal: 'Identify what to automate',
    chatbotPrompt: `Welcome to the Owner path. Before we build anything, we need to find the right thing to automate.

Your first milestone: **The Automation Audit**

I want you to track your work for 2-3 days. Write down every task that:
- You do repeatedly (weekly or more)
- Follows a predictable pattern
- Doesn't require your unique creativity or judgment

When you have at least 10 tasks, come back and share them. We'll rank them by ROI together.`,
    completionCriteria: [
      'List of 10+ repetitive tasks',
      'Each task includes: frequency, time spent, current pain',
    ],
    validationFocus: 'Review list completeness, ask clarifying questions, help rank by automation ROI',
  },
  {
    number: 2,
    title: 'Process Mapping',
    goal: 'Document your target process',
    chatbotPrompt: `Great audit! Based on what you shared, I recommend we automate: {recommended_task}

Your next milestone: **Process Mapping**

Document exactly how this process works today:
1. What triggers it? (email, schedule, request, etc.)
2. What steps happen? (be specific)
3. What tools do you touch? (apps, websites, docs)
4. What decisions get made along the way?
5. What's the output?

Draw it out or describe it step-by-step. Share with me when ready.`,
    completionCriteria: [
      'Complete process flow (text or diagram)',
      'All decision points identified',
      'Input/output clearly defined',
    ],
    validationFocus: 'Review for completeness, identify gaps, ensure process is well-understood',
  },
  {
    number: 3,
    title: 'Architecture Design',
    goal: 'Design your multi-agent system',
    chatbotPrompt: `Now let's design your AI system.

Your milestone: **Architecture Design**

Based on your process, decide on:
1. **Pattern**: Orchestrator (manager + workers), Pipeline (sequential), or Swarm (parallel)?
2. **Agents**: What specialized agents do you need? (e.g., Researcher, Writer, Reviewer)
3. **Tools**: What does each agent need access to?
4. **Handoffs**: How do agents pass work to each other?

Sketch your architecture. Can be rough - we'll refine it together.`,
    completionCriteria: [
      'Architecture diagram or description',
      'Each agent has clear role and tools',
      'Data flow is defined',
    ],
    validationFocus: 'Review architecture for clarity, suggest improvements, validate feasibility',
  },
  {
    number: 4,
    title: 'Stack Selection',
    goal: 'Choose your tools',
    chatbotPrompt: `Time to pick your weapons.

Your milestone: **Stack Selection**

Choose and set up:
1. **Agent Platform**: Make.com (easiest), n8n (more control), Relevance AI (no-code agents), or code (maximum power)?
2. **AI Model**: Claude (best reasoning), GPT-4 (broadest ecosystem), or mix?
3. **Integrations**: How will you connect to your existing tools?

Create accounts and do a "hello world" test. Show me it works - screenshot or share what you built.`,
    completionCriteria: [
      'Stack chosen with reasoning',
      'Accounts created',
      'Basic test completed (screenshot/proof)',
    ],
    validationFocus: 'Confirm setup works, help troubleshoot issues, validate stack choice',
  },
  {
    number: 5,
    title: 'First Agent',
    goal: 'Build one working agent',
    chatbotPrompt: `Let's build your first agent. Start with the most critical one from your architecture.

Your milestone: **First Agent**

Build an agent that:
1. Accepts a specific input
2. Uses at least one tool (API, web search, file access, etc.)
3. Produces a structured output

Test it with 3 real examples from your business. Share the inputs and outputs with me.`,
    completionCriteria: [
      'Agent built and functional',
      '3 real test cases completed',
      'Input/output examples shared',
    ],
    validationFocus: 'Review outputs for quality, help debug issues, suggest improvements',
  },
  {
    number: 6,
    title: 'Full System Integration',
    goal: 'Connect all agents together',
    chatbotPrompt: `One agent down. Now let's build the team.

Your milestone: **Full System Integration**

Build your remaining agents and connect them:
1. All agents from your architecture built
2. Handoffs working between agents
3. End-to-end flow functional

Run the full system on 5 real examples. Document what happens at each step.`,
    completionCriteria: [
      'All agents built',
      'End-to-end flow works',
      '5 real test runs documented',
    ],
    validationFocus: 'Review end-to-end results, identify weak points, suggest optimizations',
  },
  {
    number: 7,
    title: 'Error Handling',
    goal: 'Make it robust',
    chatbotPrompt: `Your system works when everything goes right. What about when it doesn't?

Your milestone: **Error Handling**

Add resilience:
1. What happens if an API is down? (retry logic)
2. What happens if data is malformed? (validation)
3. What happens if the AI hallucinates? (verification steps)
4. When should a human be alerted? (escalation rules)

Break your system on purpose, then fix it. Show me the failure modes you handled.`,
    completionCriteria: [
      '3+ failure modes identified and handled',
      'Retry/fallback logic implemented',
      'Human escalation path defined',
    ],
    validationFocus: 'Review error handling coverage, test edge cases, validate escalation logic',
  },
  {
    number: 8,
    title: 'Production Deployment',
    goal: 'Get it running 24/7',
    chatbotPrompt: `Time to go live. Your system needs to run without you babysitting it.

Your milestone: **Production Deployment**

Deploy your system:
1. Running on schedule or trigger (not manually started)
2. Secrets properly secured (not in code)
3. Logging enabled (you can see what happened)
4. Status dashboard (you can check without SSH)

Let it run for 48 hours on real work. Share the logs/results.`,
    completionCriteria: [
      'System deployed (screenshot of hosting)',
      '48+ hours of production logs',
      'Real work processed automatically',
    ],
    validationFocus: 'Review production logs, confirm stability, check for issues',
  },
  {
    number: 9,
    title: 'Cost & Performance',
    goal: 'Make it efficient',
    chatbotPrompt: `It works. But is it worth it? Let's check the economics.

Your milestone: **Cost & Performance Analysis**

Calculate:
1. Cost per task (API costs, hosting, etc.)
2. Time saved per task (vs. doing manually)
3. Monthly projected cost at your current volume
4. ROI (value created vs. cost)
5. Any bottlenecks slowing things down?

Share your numbers. Be honest - if it doesn't make sense economically, we'll fix it.`,
    completionCriteria: [
      'Cost per task calculated',
      'Time savings documented',
      'ROI analysis complete',
      'Optimization opportunities identified',
    ],
    validationFocus: 'Review numbers for accuracy, suggest optimizations, validate ROI',
  },
  {
    number: 10,
    title: 'Certification Submission',
    goal: 'Prove you built something real',
    chatbotPrompt: `You've built a production AI system. Now let's package it for certification.

Your final milestone: **Certification Submission**

Prepare and submit:
1. **Architecture diagram** - Visual representation of your system
2. **Demo video** (5-10 min) - Walk through how it works
3. **Production evidence** - Logs/screenshots showing 48+ hours of real operation
4. **ROI analysis** - Your numbers from Milestone 9
5. **Documentation** - How to maintain and extend the system

Upload everything. I'll review against our certification rubric.`,
    completionCriteria: [
      'All 5 artifacts submitted',
      'System is actually running in production',
      'Clear business value demonstrated',
    ],
    validationFocus: 'Full review against certification rubric, detailed scoring feedback',
  },
];

export const EMPLOYEE_MILESTONES: Milestone[] = [
  {
    number: 1,
    title: 'Time Audit',
    goal: 'Find your time drains',
    chatbotPrompt: `Welcome to the Employee path. Let's find where your time goes.

Your first milestone: **Time Audit**

For the next 2-3 days, track every repetitive task you do:
- Meeting prep and follow-ups
- Report generation
- Email sorting and responding
- Data entry or transfers
- Status updates and check-ins

List at least 10 tasks with how long each takes weekly.`,
    completionCriteria: [
      'List of 10+ repetitive tasks',
      'Weekly time estimate for each',
      'Pain level noted (low/medium/high)',
    ],
    validationFocus: 'Help identify highest-impact automations',
  },
  {
    number: 2,
    title: 'Quick Win Selection',
    goal: 'Pick first automation target',
    chatbotPrompt: `Based on your audit, let's pick your first automation.

Your milestone: **Quick Win Selection**

The best first automation is:
- Takes 1+ hour weekly
- Follows predictable steps
- Doesn't need special approvals
- Low risk if it makes a mistake

Which task from your list fits this? Tell me about it in detail.`,
    completionCriteria: ['One task selected', 'Detailed process description', 'Success criteria defined'],
    validationFocus: 'Validate selection is achievable and valuable',
  },
  {
    number: 3,
    title: 'Tool Discovery',
    goal: 'Find the right no-code tools',
    chatbotPrompt: `Now let's find your tools.

Your milestone: **Tool Discovery**

For your first automation, explore:
- Zapier or Make.com for connecting apps
- ChatGPT or Claude for writing/summarizing
- Notion AI or Google Workspace AI for docs

Create a free account and do one test automation. Show me what you tried.`,
    completionCriteria: ['Tool selected', 'Account created', 'Test automation completed'],
    validationFocus: 'Confirm tool fits use case',
  },
  {
    number: 4,
    title: 'First Automation',
    goal: 'Build and test your automation',
    chatbotPrompt: `Time to build.

Your milestone: **First Automation**

Create your automation end-to-end:
1. Trigger: What starts it?
2. Actions: What does it do?
3. Output: What's the result?

Run it on 5 real examples. Share the results.`,
    completionCriteria: ['Automation built', '5 test runs completed', 'Results documented'],
    validationFocus: 'Review quality of outputs',
  },
  {
    number: 5,
    title: 'Workflow Integration',
    goal: 'Connect to your daily tools',
    chatbotPrompt: `Your automation works. Now make it seamless.

Your milestone: **Workflow Integration**

Integrate with your daily workflow:
- Trigger from where you naturally work (email, Slack, calendar)
- Output to where you need results (docs, spreadsheet, chat)
- Add notifications so you know when it runs

Show me how it fits into your actual workday.`,
    completionCriteria: [
      'Integrated with daily tools',
      'Triggers automatically',
      'Notifications configured',
    ],
    validationFocus: 'Validate integration is practical',
  },
  {
    number: 6,
    title: 'Expansion',
    goal: 'Add 2 more automations',
    chatbotPrompt: `One down. Let's multiply your impact.

Your milestone: **Expansion**

Build 2 more automations from your audit list. For each:
1. Document the process
2. Build the automation
3. Test with real data
4. Integrate into workflow

Show me all 3 automations working.`,
    completionCriteria: ['2 additional automations built', 'All 3 tested and working', 'Integrated into workflow'],
    validationFocus: 'Review quality and coverage',
  },
  {
    number: 7,
    title: 'Error Proofing',
    goal: 'Handle edge cases',
    chatbotPrompt: `Let's make your automations bulletproof.

Your milestone: **Error Proofing**

For each automation:
1. What could go wrong?
2. How will you know if it fails?
3. What's the fallback?

Add error handling and show me the safety nets.`,
    completionCriteria: ['Error cases identified', 'Fallbacks implemented', 'Notifications for failures'],
    validationFocus: 'Validate robustness',
  },
  {
    number: 8,
    title: 'Documentation',
    goal: 'Create runbook',
    chatbotPrompt: `Document what you built.

Your milestone: **Documentation**

Create a simple runbook:
- What each automation does
- How to check if it's working
- How to fix common issues
- How to turn it off if needed

This is for future you (or a teammate).`,
    completionCriteria: ['All automations documented', 'Troubleshooting steps included', 'Clear and readable'],
    validationFocus: 'Review completeness and clarity',
  },
  {
    number: 9,
    title: 'ROI Calculation',
    goal: 'Prove time saved',
    chatbotPrompt: `Let's calculate your wins.

Your milestone: **ROI Calculation**

For your 3 automations combined:
1. Hours saved per week
2. Monthly time reclaimed
3. What you're doing with that time now
4. Any cost savings (tools, etc.)

Show me the before/after.`,
    completionCriteria: ['Time savings calculated', 'Before/after comparison', 'Value articulated'],
    validationFocus: 'Validate numbers are credible',
  },
  {
    number: 10,
    title: 'Certification Submission',
    goal: 'Demo your automations',
    chatbotPrompt: `Time to certify.

Your final milestone: **Certification Submission**

Prepare:
1. **Demo video** (5-10 min) showing all 3 automations
2. **Runbook** from Milestone 8
3. **ROI summary** from Milestone 9
4. **1 month of logs** showing real usage

Submit everything for review.`,
    completionCriteria: ['Demo video uploaded', 'Runbook complete', 'ROI documented', 'Usage logs provided'],
    validationFocus: 'Full certification review',
  },
];

export const STUDENT_MILESTONES: Milestone[] = [
  {
    number: 1,
    title: 'Concept Exploration',
    goal: 'Understand AI capabilities',
    chatbotPrompt: `Welcome to the Student path. Let's start by understanding what AI can actually do.

Your first milestone: **Concept Exploration**

Spend time exploring:
- ChatGPT, Claude, or other AI assistants
- AI-powered tools (Midjourney, Cursor, etc.)
- Examples of AI projects others have built

Come back and tell me: What surprised you? What seems overhyped? What excites you most?`,
    completionCriteria: [
      'Explored 3+ AI tools',
      'Documented observations',
      'Identified area of interest',
    ],
    validationFocus: 'Assess understanding and guide toward project ideas',
  },
  {
    number: 2,
    title: 'Project Selection',
    goal: 'Choose portfolio project',
    chatbotPrompt: `Now let's pick your project.

Your milestone: **Project Selection**

A great portfolio project:
- Solves a real problem (even a small one)
- Can be demoed in 2 minutes
- Uses AI in a meaningful way (not just a wrapper)
- Is achievable in 2-3 weeks

What will you build? Pitch me your idea.`,
    completionCriteria: ['Project idea defined', 'Problem/solution articulated', 'Scope is realistic'],
    validationFocus: 'Validate idea is achievable and impressive',
  },
  {
    number: 3,
    title: 'Tool Setup',
    goal: 'Configure development environment',
    chatbotPrompt: `Let's get your tools ready.

Your milestone: **Tool Setup**

Set up your development environment:
- Code editor (VS Code, Cursor, Replit)
- AI API access (OpenAI, Anthropic, or free alternatives)
- Version control (GitHub)
- Deployment platform (Vercel, Railway, or similar)

Show me everything is working with a "hello world" that calls an AI API.`,
    completionCriteria: ['Dev environment configured', 'API access working', 'Hello world with AI call'],
    validationFocus: 'Troubleshoot setup issues',
  },
  {
    number: 4,
    title: 'Prototype',
    goal: 'Build v0.1',
    chatbotPrompt: `Time to build.

Your milestone: **Prototype**

Build the core functionality:
- Focus on the main feature only
- Don't worry about UI polish
- Get it working end-to-end

Share your v0.1 with me. What works? What's broken?`,
    completionCriteria: ['Core feature working', 'End-to-end flow functional', 'Known issues documented'],
    validationFocus: 'Review code and approach',
  },
  {
    number: 5,
    title: 'Iteration',
    goal: 'Improve based on feedback',
    chatbotPrompt: `Let's improve your prototype.

Your milestone: **Iteration**

Based on our feedback:
1. Fix the biggest issues
2. Improve the AI prompts/logic
3. Handle edge cases

Show me v0.2 with improvements.`,
    completionCriteria: ['Major issues fixed', 'AI logic improved', 'Edge cases handled'],
    validationFocus: 'Review improvements',
  },
  {
    number: 6,
    title: 'Deployment',
    goal: 'Ship to production',
    chatbotPrompt: `Time to go live.

Your milestone: **Deployment**

Deploy your project:
- Live URL anyone can access
- Environment variables secured
- Basic error handling
- Works on mobile

Share your live link.`,
    completionCriteria: ['Live URL working', 'Secrets secured', 'Mobile-responsive'],
    validationFocus: 'Test live deployment',
  },
  {
    number: 7,
    title: 'Documentation',
    goal: 'README and demo',
    chatbotPrompt: `Make your project presentable.

Your milestone: **Documentation**

Create:
- README with project description
- How to run locally
- Tech stack explanation
- Screenshots or GIF demo

Push to GitHub.`,
    completionCriteria: ['README complete', 'Setup instructions work', 'Visual demo included'],
    validationFocus: 'Review documentation quality',
  },
  {
    number: 8,
    title: 'Polish',
    goal: 'UI/UX improvements',
    chatbotPrompt: `Let's make it impressive.

Your milestone: **Polish**

Improve the user experience:
- Clean, modern UI
- Clear user flow
- Loading states
- Error messages

Show me the polished version.`,
    completionCriteria: ['UI looks professional', 'UX is smooth', 'States handled properly'],
    validationFocus: 'Review polish and professionalism',
  },
  {
    number: 9,
    title: 'Presentation Prep',
    goal: 'Create walkthrough',
    chatbotPrompt: `Prepare to present your work.

Your milestone: **Presentation Prep**

Create:
- 2-minute demo script
- Key talking points (problem, solution, tech)
- What you learned
- What you'd improve next

Practice and share your script.`,
    completionCriteria: ['Demo script written', 'Talking points clear', 'Can articulate learnings'],
    validationFocus: 'Coach on presentation',
  },
  {
    number: 10,
    title: 'Certification Submission',
    goal: 'Submit portfolio piece',
    chatbotPrompt: `Final submission time.

Your milestone: **Certification Submission**

Submit:
1. **Live project URL**
2. **GitHub repository**
3. **Demo video** (2-3 min walkthrough)
4. **Write-up**: What you built, why, and what you learned

This becomes part of your verified portfolio.`,
    completionCriteria: [
      'Live URL submitted',
      'GitHub repo public',
      'Demo video recorded',
      'Write-up complete',
    ],
    validationFocus: 'Full certification review',
  },
];

export function getMilestones(path: 'owner' | 'employee' | 'student'): Milestone[] {
  switch (path) {
    case 'owner':
      return OWNER_MILESTONES;
    case 'employee':
      return EMPLOYEE_MILESTONES;
    case 'student':
      return STUDENT_MILESTONES;
  }
}

export function getMilestone(path: 'owner' | 'employee' | 'student', number: number): Milestone | undefined {
  return getMilestones(path).find((m) => m.number === number);
}
