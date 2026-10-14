# Master Service Agreement (Inter-Agency)

**CLIMA Platform Service Level Agreement**

**Between:** Palayan City ICT Office (Service Provider)  
**And:** Participating Government Agencies (Service Recipients)

**Effective Date:** January 15, 2025  
**Term:** 3 years (renewable)  
**Review Cycle:** Quarterly

---

## 1. Agreement Purpose

This Master Service Agreement (MSA) defines the service levels, responsibilities, and operational commitments for the CLIMA (Climate Information Monitoring and Awareness) platform operated by Palayan City ICT Office for participating government agencies involved in disaster response and management.

## 2. Definitions

- **Service Provider:** Palayan City ICT Office
- **Service Recipients:** CDRRMO, BFP, DOH/Health Office, PNP, DA, Municipal Utilities
- **Platform:** CLIMA web and mobile application, backend infrastructure, APIs
- **Incident:** Any unplanned service disruption or degradation
- **Downtime:** Period when core CLIMA features are unavailable
- **Maintenance Window:** Pre-scheduled downtime for updates and maintenance

## 3. Services Provided

### 3.1 Core Platform Services

**Real-Time Data Management:**
- Incident report ingestion and routing (target: <2 seconds from submission to agency notification)
- Weather data integration and display (updated every 5 minutes)
- Advisory publication and distribution (push notifications within 30 seconds)

**User Management:**
- Admin account provisioning within 24 hours of request
- Password reset and account recovery (OTP delivery within 60 seconds)
- Role-based access control and permissions management

**Reporting and Analytics:**
- Real-time dashboards with <5-second data refresh
- Downloadable CSV/Excel reports for audits
- Historical data access (7 years retention)

**Mobile Access:**
- Responsive design for smartphones and tablets
- Progressive Web App (PWA) for offline capability
- Cross-platform compatibility (iOS, Android, Windows, macOS)

### 3.2 Support Services

**Technical Support:**
- Email support: ict@palayan.gov.ph (response within 4 business hours)
- Phone support: (044) XXX-XXXX (8 AM - 5 PM, Monday-Friday)
- Emergency hotline: [Emergency ICT Number] (24/7 for critical outages)

**Training and Onboarding:**
- Initial admin training (2-hour session for new agencies)
- Refresher training (annually or upon major updates)
- Video tutorials and user guides available on platform

**System Monitoring:**
- 24/7 uptime monitoring and alerting
- Monthly service reports to agency heads
- Quarterly business review meetings

## 4. Service Level Targets

### 4.1 Availability

| Service Tier | Target Uptime | Allowed Downtime per Month | Measurement Period |
|--------------|---------------|----------------------------|-------------------|
| Critical (Incident Submission) | 99.5% | 3.6 hours | 24/7 |
| Standard (Dashboards, Reports) | 99.0% | 7.2 hours | Business hours (8 AM - 8 PM) |
| Non-Critical (Analytics, Exports) | 95.0% | 36 hours | Business hours |

**Exclusions from Availability Calculation:**
- Scheduled maintenance windows (announced 7 days in advance)
- Force majeure events (natural disasters, ISP outages, power grid failures)
- Third-party service outages (Supabase, Mapbox, weather API)

### 4.2 Performance

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Page Load Time | <3 seconds (90th percentile) | Synthetic monitoring from Palayan City |
| API Response Time | <500ms (95th percentile) | Application performance monitoring |
| Report Submission to Notification | <2 seconds | End-to-end transaction monitoring |
| Database Query Performance | <1 second (95th percentile) | Database profiler |

### 4.3 Data Integrity

- **Backup Frequency:** Daily incremental, weekly full
- **Backup Retention:** 90 days
- **Recovery Time Objective (RTO):** 4 hours (time to restore service)
- **Recovery Point Objective (RPO):** 24 hours (maximum data loss)
- **Data Accuracy:** 99.9% (verified through monthly audits)

### 4.4 Security

- **Vulnerability Patching:** Critical vulnerabilities patched within 72 hours
- **Security Incident Response:** Acknowledgment within 1 hour, containment within 24 hours
- **Penetration Testing:** Annually (or after major updates)
- **Access Review:** Quarterly audit of admin user access

## 5. Responsibilities

### 5.1 Service Provider (ICT Office) Responsibilities

**Platform Operations:**
- Maintain server infrastructure and hosting environment
- Apply security patches and software updates
- Monitor system performance and uptime
- Manage backups and disaster recovery

**User Support:**
- Provide technical assistance to admin users
- Troubleshoot and resolve platform issues
- Deliver training and documentation
- Respond to support requests within SLA timeframes

**Development and Enhancement:**
- Implement bug fixes and critical patches within 5 business days
- Roll out new features quarterly (with user acceptance testing)
- Maintain compatibility with latest browser versions
- Optimize database performance as needed

**Compliance and Governance:**
- Ensure compliance with Data Privacy Act (R.A. 10173)
- Conduct annual security audits
- Maintain NPC-required data protection documentation
- Coordinate with COA for financial audits

### 5.2 Service Recipient (Agency) Responsibilities

**User Management:**
- Promptly notify ICT Office of personnel changes (hirings, separations, transfers)
- Ensure admin users complete mandatory training
- Enforce password policies and security best practices
- Review and approve access requests from their personnel

**Data Quality:**
- Enter accurate and timely operational data (hospital records, operations logs)
- Correct data entry errors within 24 hours of discovery
- Validate data before submission for public display
- Follow data entry standards and guidelines

**Security:**
- Report suspected security incidents immediately
- Comply with Data Processing Agreement (DPA) terms
- Protect login credentials (no sharing, no weak passwords)
- Use secure devices when accessing CLIMA (updated OS, antivirus)

**Communication:**
- Designate a primary point of contact (POC) and backup
- Attend quarterly service review meetings
- Provide feedback on bugs, feature requests, and usability issues
- Participate in user acceptance testing for major updates

## 6. Support Procedures

### 6.1 Incident Severity Levels

**Severity 1 - Critical (Response: 1 hour)**
- Platform completely unavailable
- Data breach or security incident
- Widespread data loss or corruption
- Emergency advisory system failure during active disaster

**Severity 2 - High (Response: 4 hours)**
- Core feature unavailable (e.g., report submission broken)
- Significant performance degradation affecting multiple agencies
- Authentication system failure
- Payment or integration failure impacting operations

**Severity 3 - Medium (Response: 1 business day)**
- Minor feature malfunction (e.g., export button not working)
- Cosmetic issues affecting usability
- Non-critical API errors
- Single user account issues

**Severity 4 - Low (Response: 3 business days)**
- Enhancement requests
- Documentation updates
- Non-urgent questions or clarifications
- Training requests

### 6.2 Incident Escalation

1. **Initial Contact:** Email ict@palayan.gov.ph or call support line
2. **Acknowledgment:** ICT Office confirms receipt within SLA response time
3. **Investigation:** Technical team diagnoses issue
4. **Resolution:** Fix deployed and verified
5. **Post-Incident Report:** Root cause analysis shared within 5 business days (Severity 1-2 only)

**Escalation Path:**
- Level 1: ICT Technical Support
- Level 2: ICT Systems Administrator
- Level 3: ICT Officer / Department Head
- Level 4: City Administrator (for political or budget issues)

### 6.3 Maintenance Windows

**Scheduled Maintenance:**
- **Frequency:** Monthly (first Sunday of each month, 2 AM - 6 AM)
- **Notification:** 7 days in advance via email and in-app banner
- **Emergency Maintenance:** May occur without advance notice for critical security patches

**During Maintenance:**
- Platform may be unavailable or operate in read-only mode
- Incident submissions may be queued and processed after maintenance
- Emergency hotline numbers provided as backup

## 7. Service Monitoring and Reporting

### 7.1 Monthly Service Reports

ICT Office provides monthly reports including:
- Uptime percentage and downtime incidents
- Performance metrics (page load times, API response times)
- Support ticket volume and resolution times
- Security events and vulnerability patches applied
- User activity statistics (registrations, reports submitted)

### 7.2 Quarterly Business Reviews (QBR)

**Attendees:** ICT Officer, agency heads or POCs  
**Agenda:**
- Review service performance against SLAs
- Discuss incidents and lessons learned
- Present roadmap and upcoming features
- Collect feedback and feature requests
- Review budget and resource needs

### 7.3 Annual Service Assessment

Comprehensive annual review covering:
- Overall service satisfaction (survey)
- Cost-benefit analysis
- Compliance audit results
- Strategic planning for next fiscal year

## 8. Service Credits and Remedies

### 8.1 Service Credit Policy

Since CLIMA is a free government service, traditional service credits (refunds) do not apply. However, if ICT Office fails to meet SLA targets:

**Downtime Exceeds Allowed Threshold:**
- Root cause analysis mandatory
- Written remediation plan within 10 business days
- Priority allocation of resources to fix systemic issues

**Repeated SLA Failures (3+ months consecutive):**
- Escalation to City Administrator
- Budget request for infrastructure improvements
- Consideration of alternative hosting or service providers

### 8.2 Agency Remedies

Agencies may:
- Request priority support for critical issues
- Demand faster feature implementation if gaps affect public safety
- Participate in governance committee to influence roadmap
- Escalate grievances to City Administrator or Sangguniang Panlungsod

### 8.3 ICT Office Remedies

If an agency violates this MSA (e.g., data breach due to negligence):
- Mandatory remedial training
- Temporary access suspension pending investigation
- Cost recovery for remediation efforts (in cases of gross negligence)
- Termination of access (extreme cases, with City Administrator approval)

## 9. Financial Arrangements

### 9.1 Cost Allocation

CLIMA operational costs are funded by:
- **Palayan City General Fund:** 70% (ICT and DRRM budget line items)
- **National DRRM Allocations:** 20% (when available)
- **Grants and External Support:** 10% (development partners)

### 9.2 No Inter-Agency Charges

Participating agencies are **not charged** for CLIMA access. Costs absorbed by City Government as a public good.

### 9.3 Budget Transparency

Annual CLIMA budget breakdown provided to:
- City Council (for approval)
- COA (for audit)
- Partner agencies (for transparency)
- Public (via FOI requests)

## 10. Intellectual Property

### 10.1 Ownership

- **CLIMA Platform:** Owned by Palayan City Government
- **Custom Code:** Developed by ICT Office or contractors (City retains ownership)
- **Open Source Components:** Governed by respective licenses (MIT, Apache, etc.)
- **Data:** Owned by respective contributing agencies; shared per DPA

### 10.2 License to Use

Participating agencies receive a non-exclusive, non-transferable license to use CLIMA for official government functions only. No commercial use permitted.

### 10.3 Branding

- CLIMA logo and branding are property of Palayan City
- Agencies may reference CLIMA in official communications with permission
- No agency may rebrand or white-label CLIMA without written consent

## 11. Confidentiality

All parties agree to:
- Treat operational details of CLIMA as government confidential information
- Not disclose security vulnerabilities publicly without coordinated disclosure
- Protect personal data in accordance with R.A. 10173 and DPA
- Execute NDAs for contractors or vendors working on CLIMA

**Exceptions to Confidentiality:**
- Information required to be disclosed by law (FOI, court orders)
- Public information already available on CLIMA's public-facing dashboards
- Anonymized statistics for transparency reporting

## 12. Liability and Indemnification

### 12.1 Limitation of Liability

To the maximum extent permitted by law:
- Palayan City's liability limited to direct damages only
- No liability for indirect, consequential, or punitive damages
- Maximum liability capped at annual CLIMA operational budget

### 12.2 Force Majeure

Neither party liable for delays or failures due to:
- Natural disasters (typhoons, earthquakes, floods)
- Acts of war, terrorism, civil unrest
- Government actions (laws, regulations, orders)
- Infrastructure failures beyond reasonable control (nationwide internet outage)

### 12.3 Indemnification

Each agency indemnifies Palayan City for:
- Claims arising from the agency's misuse of CLIMA
- Data breaches caused by agency's negligence
- Violations of R.A. 10173 attributable to the agency

Palayan City indemnifies agencies for:
- Claims arising from CLIMA platform defects
- Intellectual property infringement by CLIMA
- Data breaches caused by ICT Office's negligence

## 13. Term and Termination

### 13.1 Agreement Term

This MSA is effective January 15, 2025, and continues for **3 years** with automatic renewal unless terminated.

### 13.2 Termination by Agency

An agency may terminate participation with 90 days' written notice. Upon termination:
- Access credentials revoked
- Data copies deleted (per DPA retention schedule)
- Historical data retained per legal requirements

### 13.3 Termination by ICT Office

ICT Office may terminate an agency's access for:
- Material breach of MSA or DPA
- Security violations endangering the platform
- Failure to remediate after written warning

### 13.4 Platform Discontinuation

If CLIMA is discontinued (budget cuts, strategic shift):
- 180 days' notice to all agencies
- Data export provided in open formats
- Migration support to alternative systems (if available)

## 14. Amendments

### 14.1 Amendment Process

Amendments require:
1. Written proposal from ICT Office or agency POC
2. 30-day comment period
3. Approval by City Administrator
4. Notification to all participating agencies

### 14.2 Emergency Amendments

For urgent changes (security threats, legal compliance):
- 7-day notice
- Immediate effect upon notification
- Retrospective review at next QBR

## 15. Dispute Resolution

### 15.1 Informal Resolution

Disputes first addressed through:
1. POC-to-POC discussion (5 business days)
2. ICT Officer meeting with agency head (10 business days)
3. Mediation by City Administrator (15 business days)

### 15.2 Formal Resolution

If informal resolution fails:
- Referral to City Legal Office for opinion
- Escalation to Sangguniang Panlungsod if policy interpretation needed
- Binding arbitration or litigation as last resort

## 16. Governing Law

This MSA is governed by:
- Local Government Code (R.A. 7160)
- Data Privacy Act (R.A. 10173)
- DRRM Act (R.A. 10121)
- General Appropriations Act (annual)
- Civil Code of the Philippines

Venue for legal disputes: Regional Trial Court of Palayan City, Nueva Ecija.

## 17. Entire Agreement

This MSA, together with the Data Processing Agreement (DPA) and CLIMA Terms of Service, constitutes the entire agreement among parties regarding CLIMA platform services.

## 18. Severability

If any provision is found invalid or unenforceable, the remaining provisions continue in full force.

## 19. Notices

All official notices sent to:

**For ICT Office:**  
Palayan City ICT Officer  
City Hall, Palayan City, Nueva Ecija 3132  
Email: ict@palayan.gov.ph  

**For Agencies:**  
As listed in Appendix A (Agency Contact Directory)

## 20. Execution

This MSA is executed by authorized representatives as of the Effective Date above.

---

**SIGNATURES**

**Service Provider:**

**Palayan City ICT Office**  
Signature: ___________________________  
Name: [ICT Officer Name]  
Position: Municipal/City ICT Officer  
Date: ___________________________

**Service Recipients (Participating Agencies):**

**CDRRMO Palayan**  
Signature: ___________________________  
Name: [CDRRMO Head Name]  
Position: CDRRMO Officer  
Date: ___________________________

**Bureau of Fire Protection - Palayan City**  
Signature: ___________________________  
Name: [Fire Marshal Name]  
Position: City Fire Marshal  
Date: ___________________________

**Palayan City Health Office**  
Signature: ___________________________  
Name: [Health Officer Name]  
Position: City Health Officer  
Date: ___________________________

**PNP Palayan City Station**  
Signature: ___________________________  
Name: [Chief of Police Name]  
Position: Chief of Police  
Date: ___________________________

**Department of Agriculture - Nueva Ecija**  
Signature: ___________________________  
Name: [Provincial Agriculturist Name]  
Position: Provincial Agriculturist  
Date: ___________________________

---

*This Master Service Agreement is reviewed and approved by the City Legal Office and filed with the City Administrator's Office. Copies distributed to all participating agencies.*

**Document Control:**  
Version: 1.0  
Approved By: [City Administrator Name]  
Approval Date: [Date]  
Next Review Date: April 15, 2025 (Quarterly)
