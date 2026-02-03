/**
 * CURRICULUM API
 * Returns project-based modules for each business tier
 * No quizzes - all real, meaningful projects for portfolio building
 */

import { NextRequest, NextResponse } from 'next/server';

export interface Project {
  id: string;
  title: string;
  description: string;
  deliverable: string;
  estimatedTime: string;
  skills: string[];
  aiPromptContext: string; // Context for AI to generate personalized project
}

export interface Module {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  order: number;
  tier: 'student' | 'employee' | 'owner';
  category: string;
  whyItMatters: string;
  conceptContent: string;
  realWorldExample: string;
  project: Project;
  prerequisites: string[];
}

// Comprehensive curriculum with real projects for each tier
const CURRICULUM: Record<string, Module[]> = {
  student: [
    {
      id: 'student-m1',
      title: 'The Anatomy of an Effective Prompt',
      description: 'Master the 4-part framework that separates AI pros from beginners',
      duration: 45,
      order: 1,
      tier: 'student',
      category: 'Prompt Engineering',
      whyItMatters: `Unstructured prompts waste 60% of AI's potential. The difference between "help me with emails" and a structured prompt is the difference between a confused intern and a senior assistant who knows exactly what you need.`,
      conceptContent: `Every effective prompt has four components:

**1. Context** - Set the scene. Who is the AI? What background does it need?
Example: "You are a senior marketing copywriter with 10 years of experience in B2B SaaS."

**2. Task** - Be specific. What exactly do you want?
Example: "Write a cold email to CTOs about our security product."

**3. Format** - Specify the output structure.
Example: "Use this format: Subject line, opening hook, 3 bullet points, CTA."

**4. Constraints** - Set boundaries and requirements.
Example: "Keep it under 150 words. Use a professional but friendly tone."

When you combine all four, AI outputs become predictable and high-quality.`,
      realWorldExample: `A marketing team reduced email response time by 70% after learning this. Before: "Write me a response." After: "You are a customer support rep for [company]. Respond to this complaint email. Be apologetic but firm. Keep it under 100 words."`,
      project: {
        id: 'proj-student-m1',
        title: 'Build a Personal Prompt Library',
        description: 'Create a reusable library of 5 structured prompts for tasks you do regularly',
        deliverable: 'A documented collection of 5 prompts using the CTFC framework, each tested and refined with example outputs',
        estimatedTime: '30-45 minutes',
        skills: ['Prompt structure', 'Context setting', 'Output formatting'],
        aiPromptContext: `Help the user create a personal prompt library. Guide them to identify 5 tasks they do regularly (emails, reports, research, content creation, etc.) and help them structure each using the Context-Task-Format-Constraints framework. For each prompt, help them test and refine it. The goal is a reusable library they can use daily.`,
      },
      prerequisites: [],
    },
    {
      id: 'student-m2',
      title: 'Chain of Thought Prompting',
      description: 'Force AI to show its reasoning and catch errors before they happen',
      duration: 40,
      order: 2,
      tier: 'student',
      category: 'Prompt Engineering',
      whyItMatters: `AI often "jumps to conclusions" with wrong answers. Chain of Thought forces it to show its work—just like how teachers require students to show math steps. This catches errors and improves accuracy by 20-40%.`,
      conceptContent: `Chain of Thought (CoT) prompting makes AI explain its reasoning step by step.

**Why it works:**
- Forces logical progression
- Makes errors visible and catchable
- Improves accuracy on complex problems by 20-40%

**Key phrases to trigger CoT:**
- "Let's think through this step by step"
- "Walk me through your reasoning"
- "Break this down into steps before answering"
- "First analyze, then conclude"

**CoT Structure:**
1. Restate the problem in your own words
2. Identify what information you have
3. Determine what you need to find
4. Work through the logic step by step
5. Verify your answer makes sense
6. State your final conclusion`,
      realWorldExample: `A financial analyst was getting wrong investment calculations. After implementing CoT: "Analyze this stock. Step 1: Calculate P/E ratio. Step 2: Compare to industry average..." accuracy went from 65% to 94%.`,
      project: {
        id: 'proj-student-m2',
        title: 'Build a Decision Analysis Assistant',
        description: 'Create a prompt that uses CoT to help analyze any decision with pros, cons, and recommendation',
        deliverable: 'A working decision-analysis prompt that walks through options systematically, tested on 3 real decisions you face',
        estimatedTime: '30-40 minutes',
        skills: ['Chain of thought', 'Structured reasoning', 'Decision frameworks'],
        aiPromptContext: `Help the user build a decision analysis assistant using Chain of Thought prompting. The assistant should: 1) Restate the decision clearly, 2) List all options, 3) Analyze pros/cons of each, 4) Consider risks and second-order effects, 5) Make a reasoned recommendation. Have them test it on real decisions they're facing.`,
      },
      prerequisites: ['student-m1'],
    },
    {
      id: 'student-m3',
      title: 'Your First API Integration',
      description: 'Move beyond ChatGPT—connect AI to real applications',
      duration: 60,
      order: 3,
      tier: 'student',
      category: 'API Integration',
      whyItMatters: `ChatGPT is a toy. APIs are the power tools. Every AI product you use—from Notion AI to custom chatbots—is built on API calls. This skill separates AI users from AI builders.`,
      conceptContent: `APIs (Application Programming Interfaces) let you integrate AI into any application.

**What you need:**
1. **API Key** - Your authentication credential
2. **Endpoint URL** - Where to send requests
3. **Request format** - JSON with your prompt
4. **Response handling** - What to do with the result

**Simple API call structure:**
\`\`\`
POST https://api.openai.com/v1/chat/completions
Headers: Authorization: Bearer YOUR_KEY
Body: {
  "model": "gpt-4",
  "messages": [{"role": "user", "content": "Your prompt"}]
}
\`\`\`

**No-code options:**
- Zapier, Make.com, n8n for workflow automation
- These let you use APIs without writing code`,
      realWorldExample: `A small business owner built a customer support bot using API calls in a weekend. It handles 200 queries/day at $15/month—replacing a $2,000/month chat service. No coding required with workflow tools.`,
      project: {
        id: 'proj-student-m3',
        title: 'Build an Automated Content Generator',
        description: 'Create a workflow that automatically generates content when triggered',
        deliverable: 'A working automation (using Zapier, Make, or similar) that takes input and produces AI-generated content automatically',
        estimatedTime: '45-60 minutes',
        skills: ['API concepts', 'No-code automation', 'Workflow design'],
        aiPromptContext: `Guide the user to build their first AI automation. Help them choose a use case (social media posts from topics, email drafts from bullet points, meeting summaries from notes, etc.). Walk them through setting up the workflow step-by-step using a no-code tool. Focus on practical implementation they can actually use.`,
      },
      prerequisites: ['student-m1'],
    },
    {
      id: 'student-m4',
      title: 'Advanced Prompt Patterns',
      description: 'Master few-shot learning, role prompting, and output control',
      duration: 50,
      order: 4,
      tier: 'student',
      category: 'Prompt Engineering',
      whyItMatters: `Basic prompts get basic results. Advanced patterns let you control AI output precisely—matching brand voice, maintaining consistency, and handling complex multi-step tasks.`,
      conceptContent: `**Pattern 1: Few-Shot Learning**
Give examples of what you want:
"Here are 3 examples of how I write tweets: [examples]. Now write one about [topic]."

**Pattern 2: Role Prompting**
Define a detailed persona:
"You are a Stanford-trained data scientist with 15 years in fintech. You explain complex concepts simply but never oversimplify."

**Pattern 3: Output Templates**
Force specific structure:
"Respond ONLY in this JSON format: {title: '', summary: '', action_items: []}"

**Pattern 4: Self-Critique**
Make AI check its work:
"After your response, critique it and provide an improved version."

**Pattern 5: Constraint Stacking**
Layer multiple requirements:
"Write a LinkedIn post. Must be under 200 words. Include 1 statistic. End with a question. Use professional but approachable tone."`,
      realWorldExample: `A content agency trained AI on their brand voice using few-shot examples. They went from 50% of AI drafts needing major rewrites to only 10%, saving 20+ hours per week.`,
      project: {
        id: 'proj-student-m4',
        title: 'Create a Brand Voice AI Assistant',
        description: 'Build an AI that writes in a specific brand voice using few-shot learning',
        deliverable: 'A comprehensive prompt with 5+ examples that makes AI write consistently in your chosen brand voice',
        estimatedTime: '40-50 minutes',
        skills: ['Few-shot learning', 'Brand voice', 'Consistency control'],
        aiPromptContext: `Help the user create a brand voice AI assistant. First, have them define a brand (their own, a company they like, or a fictional one). Then guide them to: 1) Define voice characteristics, 2) Collect/create 5+ example pieces, 3) Build a few-shot prompt, 4) Test on various content types, 5) Refine until output is consistently on-brand.`,
      },
      prerequisites: ['student-m2'],
    },
    {
      id: 'student-m5',
      title: 'Building Your AI Portfolio',
      description: 'Capstone: Create a showcase of your AI skills for employers',
      duration: 90,
      order: 5,
      tier: 'student',
      category: 'Portfolio Building',
      whyItMatters: `Skills without proof are just claims. Your portfolio is tangible evidence that you can deliver results with AI. It's what gets you hired or promoted.`,
      conceptContent: `**What employers want to see:**
1. Real problems you've solved
2. Your thought process and methodology
3. Measurable results or improvements
4. Technical skills applied practically

**Portfolio structure:**
- **Case Study 1**: Problem → Approach → Solution → Results
- **Case Study 2**: Different domain or skill
- **Case Study 3**: Most impressive or complex project
- **Prompt Library**: Your best reusable prompts
- **Automations**: Working workflows you've built

**Presentation tips:**
- Lead with results ("Reduced X by 40%")
- Show your thinking, not just outputs
- Include failures and what you learned
- Make it easy to verify your work`,
      realWorldExample: `A job seeker created a portfolio showing 3 AI projects: an automated research assistant, a content repurposing workflow, and a customer inquiry classifier. They received 5 interview requests in 2 weeks—all specifically mentioning the portfolio.`,
      project: {
        id: 'proj-student-m5',
        title: 'Complete AI Skills Portfolio',
        description: 'Create a professional portfolio showcasing your AI capabilities',
        deliverable: 'A complete portfolio with 3 case studies, your prompt library, and documentation of automations built in this course',
        estimatedTime: '60-90 minutes',
        skills: ['Portfolio building', 'Case study writing', 'Professional presentation'],
        aiPromptContext: `Guide the user to create a professional AI skills portfolio. Help them: 1) Select their 3 best projects from the course, 2) Write compelling case studies for each (problem, approach, solution, results), 3) Organize their prompt library professionally, 4) Document their automations, 5) Create a summary/bio highlighting their AI capabilities. Focus on making it employer-ready.`,
      },
      prerequisites: ['student-m3', 'student-m4'],
    },
  ],
  employee: [
    {
      id: 'employee-m1',
      title: 'Workflow Automation Mastery',
      description: 'Identify and automate the repetitive tasks eating your productivity',
      duration: 50,
      order: 1,
      tier: 'employee',
      category: 'Workflow Design',
      whyItMatters: `The average employee spends 40% of their time on repetitive tasks. Automating just 2-3 key workflows can save 10+ hours per week—time you can spend on high-value work.`,
      conceptContent: `**The Automation Audit:**
1. Track your tasks for 2-3 days
2. Identify patterns: What do you do repeatedly?
3. Rate each task: Time spent × Frequency × Automation potential

**High-value automation targets:**
- Data entry and transfer between systems
- Report generation and formatting
- Email responses to common questions
- Meeting scheduling and follow-ups
- Document creation from templates

**Automation decision framework:**
- If it takes <2 min but happens 20x/day → Automate
- If it takes 30+ min and happens weekly → Automate
- If it requires judgment each time → Augment with AI, don't fully automate`,
      realWorldExample: `A project manager automated their weekly status report—pulling data from 4 systems, formatting it, and sending it. What took 3 hours every Monday now takes 5 minutes to review and send.`,
      project: {
        id: 'proj-employee-m1',
        title: 'Personal Productivity Audit & Automation Plan',
        description: 'Analyze your work and create a prioritized automation roadmap',
        deliverable: 'A documented audit of your workflows with 5 automation opportunities ranked by impact, including implementation plans',
        estimatedTime: '45-50 minutes',
        skills: ['Workflow analysis', 'Prioritization', 'Automation planning'],
        aiPromptContext: `Help the user conduct a thorough workflow audit. Guide them to: 1) List all regular tasks, 2) Estimate time and frequency for each, 3) Identify automation candidates, 4) Score them (time saved × ease of automation), 5) Create implementation plans for top 5. Focus on practical, high-impact opportunities in their actual job.`,
      },
      prerequisites: [],
    },
    {
      id: 'employee-m2',
      title: 'RAG: Making AI Know Your Data',
      description: 'Connect AI to your company documents, policies, and knowledge bases',
      duration: 60,
      order: 2,
      tier: 'employee',
      category: 'RAG Systems',
      whyItMatters: `AI doesn't know YOUR data—your company docs, policies, customer history. RAG fixes this by feeding AI relevant context from your own documents. It's like giving AI an open-book test with YOUR book.`,
      conceptContent: `**RAG = Retrieval Augmented Generation**

Instead of hoping AI knows your data, you:
1. **Embed** - Convert documents into searchable vectors
2. **Store** - Save in a vector database
3. **Retrieve** - When asked a question, find relevant chunks
4. **Generate** - AI answers using your documents as context

**Why RAG beats fine-tuning:**
- No expensive model training
- Easy to update (just add new docs)
- Cites sources for verification
- Works with any AI model

**Simple RAG setup:**
1. Gather your documents (PDFs, docs, wikis)
2. Upload to a RAG platform (ChatGPT, Claude, or specialized tools)
3. Test with questions only your docs can answer
4. Refine document organization for better retrieval`,
      realWorldExample: `A law firm implemented RAG with 500 case files. Lawyers can now ask "What precedents exist for [case type]?" and get answers citing specific documents with page numbers. Research time dropped 80%.`,
      project: {
        id: 'proj-employee-m2',
        title: 'Build a Team Knowledge Assistant',
        description: 'Create an AI that can answer questions about your team\'s processes and documentation',
        deliverable: 'A working RAG-powered assistant trained on your team documents that can answer process questions accurately',
        estimatedTime: '50-60 minutes',
        skills: ['RAG implementation', 'Document organization', 'Knowledge management'],
        aiPromptContext: `Guide the user to build a RAG-powered knowledge assistant. Help them: 1) Identify key documents (processes, policies, FAQs, guides), 2) Organize and prepare documents, 3) Set up using an accessible RAG platform, 4) Create effective system prompts, 5) Test with real questions, 6) Document how team members can use it.`,
      },
      prerequisites: ['employee-m1'],
    },
    {
      id: 'employee-m3',
      title: 'Custom GPT Development',
      description: 'Build specialized AI assistants for specific tasks',
      duration: 70,
      order: 3,
      tier: 'employee',
      category: 'AI Applications',
      whyItMatters: `A Custom GPT is YOUR AI assistant—trained on YOUR documents, answering YOUR questions. It's the difference between a generic assistant and one who has read every company document and understands your specific needs.`,
      conceptContent: `**Custom GPT Components:**

1. **System Prompt** - Defines personality, role, and rules
2. **Knowledge Files** - Documents the GPT can reference
3. **Conversation Starters** - Pre-built prompts for users
4. **Actions** - API connections for external data

**Building effective Custom GPTs:**

**Step 1: Define the purpose**
- What specific problem does this solve?
- Who will use it and when?
- What does success look like?

**Step 2: Create the system prompt**
- Role and expertise
- Behavior guidelines
- Output formats
- Things to always/never do

**Step 3: Add knowledge**
- Relevant documents
- FAQs and common responses
- Examples of good outputs

**Step 4: Test thoroughly**
- Edge cases and unusual requests
- Verify it stays in character
- Check knowledge retrieval accuracy`,
      realWorldExample: `An HR team built a "Policy Bot" in 2 hours. Employees ask questions like "What's our parental leave policy?" and get accurate answers citing the exact policy document. HR ticket volume dropped 60%.`,
      project: {
        id: 'proj-employee-m3',
        title: 'Build a Department-Specific AI Assistant',
        description: 'Create a Custom GPT that handles common questions and tasks for your department',
        deliverable: 'A fully functional Custom GPT with system prompt, knowledge base, and conversation starters, ready for team deployment',
        estimatedTime: '60-70 minutes',
        skills: ['Custom GPT building', 'System prompt design', 'Knowledge integration'],
        aiPromptContext: `Guide the user to build a Custom GPT for their department. Help them: 1) Identify the top use case (answering questions, drafting content, analyzing data, etc.), 2) Write a comprehensive system prompt, 3) Gather and organize knowledge files, 4) Create helpful conversation starters, 5) Test with real scenarios, 6) Create user documentation for their team.`,
      },
      prerequisites: ['employee-m2'],
    },
    {
      id: 'employee-m4',
      title: 'AI-Powered Meeting & Email Mastery',
      description: 'Automate the communication tasks that drain your day',
      duration: 45,
      order: 4,
      tier: 'employee',
      category: 'Communication',
      whyItMatters: `The average professional spends 28% of their workweek on email and 15% in meetings. AI can handle meeting summaries, action item extraction, follow-up drafts, and email responses—recovering hours every week.`,
      conceptContent: `**Meeting Automation:**
- Transcription → Summary → Action items
- Automated follow-up email drafts
- Decision documentation
- Next steps assignment

**Email Automation:**
- Response drafting for common inquiries
- Email classification and prioritization
- Thread summarization
- Follow-up reminders

**Setting up the system:**
1. Connect transcription (Otter, Fireflies, etc.)
2. Create summary prompt templates
3. Set up email drafting workflows
4. Define approval/review process

**Quality control:**
- Always review before sending
- Create feedback loops to improve
- Handle exceptions manually at first`,
      realWorldExample: `A sales manager set up meeting automation: transcription → AI summary → action items extracted → follow-up email drafted. What took 30 minutes per meeting now takes 2 minutes to review and send.`,
      project: {
        id: 'proj-employee-m4',
        title: 'Build Your Communication Automation Suite',
        description: 'Create a system that handles your meeting and email tasks automatically',
        deliverable: 'A working system for meeting summaries, action item extraction, and email drafting that you\'ll use daily',
        estimatedTime: '40-45 minutes',
        skills: ['Meeting automation', 'Email workflows', 'Productivity systems'],
        aiPromptContext: `Help the user build a communication automation suite. Guide them to: 1) Audit current meeting/email time spent, 2) Set up meeting transcription and summarization, 3) Create prompt templates for different meeting types, 4) Build email drafting prompts for common scenarios, 5) Establish a review workflow, 6) Calculate time savings.`,
      },
      prerequisites: ['employee-m1'],
    },
    {
      id: 'employee-m5',
      title: 'Workflow Efficiency Capstone',
      description: 'Document and deploy your complete AI-powered workflow system',
      duration: 80,
      order: 5,
      tier: 'employee',
      category: 'Integration',
      whyItMatters: `Individual automations are good. An integrated system is transformational. This capstone brings together everything into a documented, replicable workflow system that you can share and scale.`,
      conceptContent: `**Building Your System:**

1. **Audit** - All your automations and AI tools
2. **Connect** - Link them into workflows
3. **Document** - Create guides for each
4. **Measure** - Track time saved
5. **Share** - Help others implement

**Documentation structure:**
- System overview and architecture
- Individual workflow guides
- Troubleshooting common issues
- Measurement and metrics
- Improvement roadmap

**Scaling your system:**
- Train team members
- Create self-service guides
- Collect feedback
- Iterate and improve`,
      realWorldExample: `An operations analyst documented their entire AI workflow system. Their manager was so impressed they were asked to present to the department and help 5 colleagues implement similar systems—leading to a promotion.`,
      project: {
        id: 'proj-employee-m5',
        title: 'Complete Workflow Efficiency System',
        description: 'Integrate and document all your AI-powered workflows into a comprehensive system',
        deliverable: 'A complete system guide with all workflows documented, metrics tracked, and guides for sharing with your team',
        estimatedTime: '60-80 minutes',
        skills: ['System integration', 'Documentation', 'Knowledge sharing'],
        aiPromptContext: `Guide the user to create a comprehensive workflow efficiency system. Help them: 1) Inventory all AI tools and automations from the course, 2) Create workflow diagrams showing how they connect, 3) Write documentation for each component, 4) Set up tracking for time saved, 5) Create a guide for helping teammates implement similar systems, 6) Plan for ongoing improvements.`,
      },
      prerequisites: ['employee-m3', 'employee-m4'],
    },
  ],
  owner: [
    {
      id: 'owner-m1',
      title: 'AI Operations Audit',
      description: 'Map your entire business for AI transformation opportunities',
      duration: 60,
      order: 1,
      tier: 'owner',
      category: 'Strategy',
      whyItMatters: `Before automating, you need to understand your business operations completely. Most AI implementations fail because they automate the wrong things. A thorough audit prevents wasted resources and maximizes ROI.`,
      conceptContent: `**The AI Operations Audit:**

1. **Process Mapping**
   - Document every business process
   - Identify inputs, outputs, and stakeholders
   - Note pain points and bottlenecks

2. **Automation Scoring**
   - Volume: How often does this happen?
   - Complexity: How much judgment required?
   - Value: What's the cost of errors?
   - Data: Is input structured or unstructured?

3. **Priority Matrix**
   - Quick wins: High impact, low effort
   - Strategic: High impact, high effort
   - Fill-ins: Low impact, low effort
   - Avoid: Low impact, high effort

4. **Risk Assessment**
   - What happens if AI makes mistakes?
   - Compliance and regulatory concerns
   - Customer experience impact`,
      realWorldExample: `An e-commerce owner audited 47 business processes. They identified 12 for AI automation, prioritized 5 for immediate implementation, and calculated potential savings of $180K/year.`,
      project: {
        id: 'proj-owner-m1',
        title: 'Complete Business Operations AI Audit',
        description: 'Map every process in your business and identify AI transformation opportunities',
        deliverable: 'A comprehensive audit document with all processes mapped, scored for automation potential, and prioritized into an implementation roadmap',
        estimatedTime: '50-60 minutes',
        skills: ['Process mapping', 'Strategic analysis', 'Prioritization'],
        aiPromptContext: `Guide the business owner through a comprehensive AI operations audit. Help them: 1) List all business processes across departments, 2) Document each process (inputs, outputs, time, cost, pain points), 3) Score each for automation potential, 4) Create a priority matrix, 5) Assess risks and compliance needs, 6) Build an implementation roadmap with estimated ROI.`,
      },
      prerequisites: [],
    },
    {
      id: 'owner-m2',
      title: 'Building AI Agents',
      description: 'Create AI that takes action, not just answers questions',
      duration: 70,
      order: 2,
      tier: 'owner',
      category: 'AI Agents',
      whyItMatters: `Regular AI just answers questions. Agents TAKE ACTION. They can browse the web, write files, send emails, update databases. This is the leap from AI that talks to AI that works.`,
      conceptContent: `**What makes an agent:**
- Goal understanding
- Tool access (APIs, databases, web)
- Decision-making logic
- Action execution
- Result verification

**Agent architecture:**
1. **Perception** - Understand the task
2. **Planning** - Break into steps
3. **Action** - Execute each step
4. **Observation** - Check results
5. **Iteration** - Adjust and continue

**Tools agents can use:**
- Web browsing and research
- File creation and editing
- Email and communication
- Database queries
- API calls to other services

**Safety considerations:**
- Always have human oversight for critical actions
- Set clear boundaries on what agents can do
- Log all actions for audit
- Start with low-risk tasks`,
      realWorldExample: `A real estate agent built an AI agent that searches listings, compiles comparables, and drafts market analysis reports. What took 4 hours now takes 10 minutes of review.`,
      project: {
        id: 'proj-owner-m2',
        title: 'Build a Business Research Agent',
        description: 'Create an AI agent that can research, analyze, and report on business topics',
        deliverable: 'A working agent that can research a topic, analyze findings, and produce a structured report—tested on a real business question',
        estimatedTime: '60-70 minutes',
        skills: ['Agent design', 'Tool integration', 'Workflow automation'],
        aiPromptContext: `Guide the business owner to build a research agent. Help them: 1) Define a valuable research task for their business, 2) Specify what tools the agent needs, 3) Create the agent architecture, 4) Set up the workflow (trigger → research → analyze → report), 5) Test with a real business question, 6) Refine based on output quality.`,
      },
      prerequisites: ['owner-m1'],
    },
    {
      id: 'owner-m3',
      title: 'Customer Service Automation',
      description: 'Build AI-powered support that scales without losing quality',
      duration: 65,
      order: 3,
      tier: 'owner',
      category: 'Customer Operations',
      whyItMatters: `Customer service is expensive, hard to scale, and often inconsistent. AI can handle 60-80% of inquiries instantly, freeing your team for complex issues while improving response times from hours to seconds.`,
      conceptContent: `**AI Customer Service Stack:**

1. **First Response**
   - Instant acknowledgment
   - Basic question answering
   - Routing to right department

2. **Knowledge Base Integration**
   - RAG on your support docs
   - Product information
   - Policy lookup

3. **Escalation Logic**
   - When to involve humans
   - Sentiment detection
   - Complex issue identification

4. **Human Handoff**
   - Smooth transitions
   - Context passing
   - Customer notification

**Quality metrics:**
- First response time
- Resolution rate
- Customer satisfaction
- Escalation rate
- Cost per ticket`,
      realWorldExample: `An e-commerce owner implemented AI support: 73% of inquiries resolved without human involvement, average response time dropped from 4 hours to 30 seconds, and CSAT actually improved 8%.`,
      project: {
        id: 'proj-owner-m3',
        title: 'Build Your AI Customer Support System',
        description: 'Create an automated support system with knowledge base and escalation logic',
        deliverable: 'A working customer support AI with RAG, escalation rules, and human handoff—tested on real support scenarios',
        estimatedTime: '55-65 minutes',
        skills: ['Support automation', 'RAG implementation', 'Escalation design'],
        aiPromptContext: `Guide the business owner to build an AI customer support system. Help them: 1) Gather FAQ and support documentation, 2) Build RAG-powered knowledge retrieval, 3) Create response templates for common issues, 4) Design escalation rules (when AI should hand off), 5) Set up human notification workflow, 6) Test with real customer inquiries, 7) Create monitoring dashboard metrics.`,
      },
      prerequisites: ['owner-m2'],
    },
    {
      id: 'owner-m4',
      title: 'Multi-Agent Operations Chains',
      description: 'Orchestrate multiple AI agents working together on complex processes',
      duration: 75,
      order: 4,
      tier: 'owner',
      category: 'AI Operations',
      whyItMatters: `One agent is powerful. Multiple agents working together are transformational. An operations chain automates entire business processes—from trigger to completion—without human intervention.`,
      conceptContent: `**Operations Chain Architecture:**

1. **Trigger Agent** - Detects when process should start
2. **Data Agent** - Gathers needed information
3. **Analysis Agent** - Processes and decides
4. **Action Agent** - Executes the outcome
5. **Quality Agent** - Verifies and logs

**Example: Sales Lead Processing**
- Trigger: New lead form submitted
- Data: Enrich with company info, LinkedIn
- Analysis: Score and qualify
- Action: Add to CRM, send personalized email
- Quality: Log, notify sales rep if high-value

**Chain design principles:**
- Clear handoffs between agents
- Error handling at each step
- Human checkpoint options
- Comprehensive logging
- Easy to modify individual agents`,
      realWorldExample: `An e-commerce owner built an ops chain: Order received → Inventory checked → Supplier notified → Customer updated → Review requested. 200 orders/day processed with 0 human touches.`,
      project: {
        id: 'proj-owner-m4',
        title: 'Build a Multi-Agent Operations Chain',
        description: 'Create a chain of AI agents that handles a complete business process end-to-end',
        deliverable: 'A working operations chain with multiple agents handling a real business process from trigger to completion',
        estimatedTime: '65-75 minutes',
        skills: ['Multi-agent design', 'Process automation', 'System integration'],
        aiPromptContext: `Guide the business owner to build a multi-agent operations chain. Help them: 1) Select a complete process from their audit, 2) Design the agent chain architecture, 3) Build each agent in the chain, 4) Create handoff and error handling logic, 5) Test the complete chain end-to-end, 6) Set up monitoring and logging, 7) Calculate ROI vs. manual process.`,
      },
      prerequisites: ['owner-m2', 'owner-m3'],
    },
    {
      id: 'owner-m5',
      title: 'AI Operations Manual Capstone',
      description: 'Document your complete AI-powered business operations system',
      duration: 90,
      order: 5,
      tier: 'owner',
      category: 'Documentation',
      whyItMatters: `Your AI Operations Manual is your business's competitive advantage documented. It makes your operations scalable, trainable, and transferable. It's what turns a business that depends on you into one that runs without you.`,
      conceptContent: `**Operations Manual Structure:**

1. **Executive Summary**
   - AI transformation overview
   - Key metrics and ROI
   - Technology stack

2. **System Architecture**
   - Visual overview
   - Data flows
   - Integration points

3. **Individual Workflows**
   - Purpose and trigger
   - Step-by-step process
   - Agent configurations
   - Error handling

4. **Team Training**
   - Role-specific guides
   - Common scenarios
   - Troubleshooting

5. **Governance**
   - Security and compliance
   - Quality monitoring
   - Improvement process`,
      realWorldExample: `A service business owner completed their AI Operations Manual. When they hired a new operations manager, onboarding took 1 week instead of 3 months. When they sought investment, the documented systems increased their valuation by 40%.`,
      project: {
        id: 'proj-owner-m5',
        title: 'Complete AI Operations Manual',
        description: 'Create a comprehensive manual documenting your entire AI-powered business system',
        deliverable: 'A professional AI Operations Manual covering all systems, workflows, training guides, and governance—ready to scale your business',
        estimatedTime: '75-90 minutes',
        skills: ['Documentation', 'System design', 'Knowledge management'],
        aiPromptContext: `Guide the business owner to create their AI Operations Manual. Help them: 1) Create an executive summary of their AI transformation, 2) Document the system architecture with diagrams, 3) Write detailed guides for each workflow and agent, 4) Create team training materials, 5) Establish governance and monitoring procedures, 6) Calculate total ROI and metrics, 7) Plan for scaling and continuous improvement.`,
      },
      prerequisites: ['owner-m4'],
    },
  ],
};

// GET: Fetch curriculum for a tier
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tier = searchParams.get('tier') as 'student' | 'employee' | 'owner';
  const moduleId = searchParams.get('moduleId');

  if (!tier || !CURRICULUM[tier]) {
    return NextResponse.json(
      { error: 'Invalid tier. Must be: student, employee, or owner' },
      { status: 400 }
    );
  }

  const modules = CURRICULUM[tier];

  // If moduleId provided, return single module
  if (moduleId) {
    const module = modules.find((m) => m.id === moduleId);
    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }
    return NextResponse.json({ module });
  }

  // Return all modules for the tier (simplified for list view)
  const simplifiedModules = modules.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    duration: m.duration,
    order: m.order,
    category: m.category,
    prerequisites: m.prerequisites,
    projectTitle: m.project.title,
  }));

  return NextResponse.json({
    tier,
    modules: simplifiedModules,
    total: modules.length,
  });
}
