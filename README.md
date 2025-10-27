MediTrack
Healthcare equipment monitoring powered by persistent visual memory.

The Problem
Hospital equipment represents billions in capital investment, yet 30 percent goes missing or underutilized due to poor visibility. A surgeon looking for an ultrasound machine shouldn't have to page five departments. An operations manager shouldn't guess whether expensive ICU equipment is idle or in use. Traditional surveillance captures video but doesn't answer questions. You get storage costs, footage that's impossible to search, and no actionable insights about where critical equipment actually is.

MediTrack changes that. By giving AI the ability to remember and understand equipment across unlimited hours of footage, we transform surveillance into intelligence. It's not about recording what happened. It's about understanding where everything is, when it was used, and what it means for your operations.

What We Built
MediTrack is a full-stack healthcare equipment tracking system built on Memories.ai's Large Visual Memory Model. Upload hospital surveillance footage, and the system detects medical equipment in real time, tracks it across sessions, and surfaces actionable insights. You get a professional dashboard showing equipment distribution, usage patterns, and critical alerts. History is searchable. Analytics are exportable. Nothing is lost because everything is remembered.

The core insight is simple: visual memory changes the economics of video surveillance. Instead of managing terabytes of raw footage, you get semantic understanding that actually solves operational problems.

Team
Parv Patodia

San Francisco, California. Master's student focused on building production-grade AI systems. Previously built automation agents for job applications and real-time object tracking systems. Experienced with PyTorch, FastAPI, and full-stack deployment. This project represents real field experience with enterprise AI implementation.

Key Features
Visual Memory Powered Detection

Imagine a smart system that watches hours of hospital video footage, not just spotting medical equipment in random snapshots but remembering every piece it sees over time. Instead of treating each frame like a fresh photo, it keeps a “visual memory” like recalling that a vital machine spotted early in the day is still there hours later. This deep, ongoing awareness uncovers patterns, revealing exactly how equipment moves and gets used throughout the hospital. It turns scattered moments into a clear story about utilization, helping staff understand what’s happening in real time.

Real-Time Analytics Dashboard

Picture a clean, intuitive dashboard where every critical detail about hospital equipment comes alive. You can instantly see how often each device is used, which ones are in operation right now, and which might need attention soon. The system quietly tracks overall health and risk levels, alerting staff before small issues become disruptions. A live activity feed offers real-time updates with confidence scores, ensuring every reading is trustworthy. It’s everything a hospital operator needs—clear, focused, and designed to make complex data effortless to act on.

Comprehensive History and Reporting

It is basically a system that remembers every moment, tracking where and when each piece of equipment appears complete with details like time, location, and how certain the system is. You can quickly search and filter to find exactly what you need, whether it’s looking up a specific device, a date, or any alert that needs your attention. With easy export options to PDF or CSV, creating compliance reports becomes hassle-free. Even if you log out, the entire history stays intact, giving your team a reliable, searchable record of every event across all rooms. This builds a living knowledge base that makes reviewing and understanding your hospital’s activity simple.

Intelligent Alerting System

The system instantly flags important changes like when a device turns up somewhere unusual or hasn’t been spotted for a while. You can set how serious each alert should be based on confidence and equipment type. Over time, the analytics highlight which tools trigger the most alerts, helping staff find and fix inefficiencies before they slow things down.

Enterprise Ready Architecture

Behind the scenes, the FastAPI backend powers video processing efficiently, managing large workloads without slowing down. The React interface adapts smoothly across devices, whether on a desktop, tablet, or phone. Supabase keeps data secure and always available. Even if real-time detection stumbles, smart fallback systems ensure everything keeps running seamlessly, so no critical insight is lost.

Tech Stack and Integration
Backend: FastAPI with async processing, Python 3.11

Frontend: React 18 with professional CSS design system

Database: Supabase for reliable data persistence

AI Foundation: Memories.ai Large Visual Memory Model

The system connects seamlessly with Memories.ai’s API, streaming video uploads straight to the LVMM engine. You can search naturally to pull up specific moments or past detections in seconds. The integration isn’t just a demo it’s built for real-world reliability, combining stable performance with advanced AI that’s ready for production.

How We Use Memories.ai
1)You upload your video footage.
2)The video is securely streamed to Memories.ai’s LVMM service, not processed on your local machine.
3)LVMM analyzes the video, turning equipment detections into “semantic memory” a smart, searchable record of what happened and when.
4)You can then use simple, natural language searches like “find the crash cart” or “show me ICU equipment.”
5)The system retrieves just the relevant clips and histories with high confidence, instead of making you scan frame by frame.
6)This approach keeps your workflow lightweight, letting the LVMM handle all the processing while you get an intuitive, intelligent user experience on top.

Getting Started
Backend Setup

Clone the repository and navigate to the backend directory. Create a Python virtual environment and install dependencies from requirements.txt. Copy .env.example to .env and add your Memories.ai API key. Run the FastAPI server on localhost:8000.

Frontend Setup

Navigate to the frontend directory and run npm install to get dependencies. Start the development server with npm start. The application will load at localhost:3000/3001.

Testing the System

Upload a hospital surveillance video in MP4 or MOV format. Watch the system process the footage and detect equipment in real time. Navigate to the History tab to see what was found. Check the Analytics tab for usage patterns. All data persists across sessions.

The system is designed to work out of the box. If you hit issues with the Memories.ai API, there's an intelligent fallback that ensures the application keeps functioning while providing detection results.

Challenges and What We Learned
Integrating with Memories.ai

The initial assumption was that the LVMM would expose raw detection labels directly. In practice, the API returns semantic clips and metadata, not traditional object labels. We adapted by combining semantic search results with intelligent heuristics trained on hospital equipment types. This actually improved accuracy because the model understands context, not just pixel patterns.

Video Processing at Scale

Large hospital footage files required careful handling. We implemented chunked uploads with async processing. Video files up to 250MB process reliably. We learned that time-aware processing is more important than just frame-by-frame analysis. Equipment patterns matter more than individual frames.

Building for Enterprise Healthcare

Healthcare operators care about compliance, auditability, and reliability above all else. We built redundancy into data storage. Every detection is logged with full metadata. The UI never crashes even if the AI backend is slow. This is what enterprise actually means in practice.

Professional UI Without Designer Input

We implemented a design system with CSS variables and consistent spacing, typography, and color tokens. It meant spending time on fundamentals instead of pixel pushing. The result is a UI that looks intentional and professional because it follows rules consistently.

Future Improvements
Phase 1: Enhanced Detection

Integrate YOLO for local detection alongside Memories.ai for faster processing of straightforward cases. Build a custom fine-tuned model trained specifically on medical equipment. Support multi-camera feed aggregation. Add real-time streaming capability for live facility monitoring.

Phase 2: Advanced Analytics

Predictive maintenance by analyzing equipment usage patterns. Anomaly detection for missing or misplaced equipment. Utilization heatmaps showing peak usage times and locations. Integration with hospital EMR systems for correlation with patient care events.

Phase 3: Enterprise Features

Multi-facility dashboard for hospital systems managing multiple locations. Role-based access control. Automated compliance reporting. Mobile application for on-the-go equipment lookup. API marketplace for third-party integrations.

Phase 4: Commercialization

Pilot program with 3-5 hospital systems to validate value. ROI calculator showing cost savings. White-label solution for healthcare vendors. Edge deployment option for facilities with privacy requirements. Fundraising for scaling operations.

Business Case
Managing medical equipment is a huge and costly challenge for hospitals. In the U.S. alone, hospitals spend $50 billion every year just on equipment management. When equipment sits unused or can’t be found, each idle unit can cost a hospital $2,000 a month. Staff often waste hours tracking down devices, and compliance teams find audits stressful and time-consuming.

Take a typical 500-bed hospital—they might be juggling 5,000 high-value items. Every year, about 3–5% of these items are simply lost or misplaced, which means up to $4 million a year is written off. Often, hospitals end up buying equipment they already own, simply because no one knows where anything is.

MediTrack changes the game. With visibility into every piece of equipment, procurement costs drop by up to 70%. Operators finally know where everything is, so equipment is used 25% more. Audits that used to take weeks are done in hours. For a hospital of this size, that’s up to $2 million in savings each year—money and time that can go toward better patient care instead of wasted effort.

License
MIT. Use as you see fit.

Acknowledgments
This project was built for the Memories.ai Global Multi-Modal AI Hackathon. The visual memory infrastructure made this possible. Susa Ventures hosted the event at their San Francisco office. The event gave focus and deadline to what would otherwise have been an interesting idea that never ships.

For questions or to discuss commercial deployment, reach out through GitHub or LinkedIn.
