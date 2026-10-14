# Data Processing Agreement

**Between:** Palayan City Government (Data Controller)  
**And:** Participating Government Agencies (Data Processors/Joint Controllers)

**Effective Date:** January 15, 2025  
**Review Date:** January 15, 2026 (Annual)

## 1. Purpose and Scope

This Data Processing Agreement (DPA) governs the sharing and processing of personal information through the CLIMA (Climate Information Monitoring and Awareness) platform among government agencies involved in disaster response and management in Palayan City.

This DPA is executed in compliance with:
- Data Privacy Act of 2012 (R.A. 10173)
- Disaster Risk Reduction and Management Act of 2010 (R.A. 10121)
- National Privacy Commission Circular 16-01 (Data Sharing Agreements)
- Freedom of Information Executive Order No. 2 (s. 2016)

## 2. Participating Agencies

### 2.1 Data Controller (Primary)
**Palayan City Information and Communications Technology (ICT) Office**  
- Role: Operates and maintains CLIMA platform
- Determines purposes and means of processing
- Responsible for overall data protection compliance

### 2.2 Joint Controllers / Data Processors

**City Disaster Risk Reduction and Management Office (CDRRMO)**
- Access: Incident reports, resource allocation data
- Purpose: Emergency response coordination, resource deployment
- Legal Basis: R.A. 10121 (DRRM Act)

**Bureau of Fire Protection (BFP) - Palayan City**
- Access: Fire-related incident reports, BFP operations data
- Purpose: Fire suppression, rescue operations
- Legal Basis: R.A. 9263 (BFP Modernization Act of 2004)

**Department of Health (DOH) - Nueva Ecija / Palayan City Health Office**
- Access: Hospital bed capacity, health-related incident reports
- Purpose: Public health emergency response, medical resource allocation
- Legal Basis: R.A. 11332 (Mandatory Reporting of Notifiable Diseases)

**Philippine National Police (PNP) - Palayan City Station**
- Access: Criminal incidents, security-related reports
- Purpose: Law enforcement, public safety
- Legal Basis: R.A. 6975 (DILG Act of 1990)

**Department of Agriculture (DA) - Provincial Office**
- Access: Agricultural damage reports, crop assessments
- Purpose: Farmer assistance, crop insurance processing
- Legal Basis: R.A. 10068 (Organic Agriculture Act)

**Municipal/City Power and Water Utilities**
- Access: Utility interruption reports
- Purpose: Service restoration, infrastructure planning
- Legal Basis: Local Government Code (R.A. 7160)

## 3. Data Categories Processed

### 3.1 Personal Data
- Full name
- Contact number and email address
- Home address (barangay-level)
- GPS coordinates of incident location
- Government-issued ID numbers (for verification purposes only)

### 3.2 Sensitive Personal Information
- Medical conditions or health status (emergency context)
- Photos of individuals affected by disasters (where present in incident photos)
- Children's information (in evacuation records)

### 3.3 Operational Data
- Incident descriptions and severity assessments
- Timestamp and location of reports
- Resource availability (hospital beds, emergency vehicles, personnel)
- Response actions and outcomes

## 4. Processing Operations

### 4.1 Permitted Processing Activities

**Collection:**
- Citizen-submitted incident reports via web and mobile
- Admin-entered operational data (hospital records, operations logs)
- Automated weather data integration (no personal information)

**Storage:**
- Encrypted databases hosted on secure cloud infrastructure
- Retention period: 7 years (R.A. 10121 disaster records requirement)
- Geographic location: Primary server in Philippines; backup in Singapore (GDPR-compliant provider)

**Use:**
- Real-time incident routing to appropriate responding agency
- Emergency resource allocation and situational awareness
- Historical analysis for disaster preparedness planning
- Anonymized public reporting and transparency

**Sharing:**
- Among authorized agencies listed in Section 2.2
- With NDRRMC during declared states of calamity
- With NPC during audits or investigations

**Disclosure:**
- To data subjects upon valid access request
- In response to lawful court orders or subpoenas
- To emergency responders when vital interests are at stake

### 4.2 Prohibited Processing Activities

**Agencies SHALL NOT:**
- Use data for purposes unrelated to disaster response and management
- Share data with unauthorized third parties or private entities
- Use data for commercial gain or political campaigning
- Process data after fulfillment of the stated purpose without new legal basis
- Transfer data outside the Philippines without adequate safeguards

## 5. Data Protection Obligations

### 5.1 Security Measures (All Agencies)

**Technical Safeguards:**
- Use encrypted connections (HTTPS/TLS) when accessing CLIMA
- Implement strong authentication (minimum 12-character passwords, MFA recommended)
- Restrict access to authorized personnel only (role-based access control)
- Use antivirus and endpoint protection on devices accessing personal data
- Promptly apply security patches and updates

**Organizational Safeguards:**
- Designate a Data Protection Officer or Privacy Focal Person
- Conduct annual data privacy training for personnel with access
- Maintain access logs and audit trails
- Implement clean desk and clear screen policies
- Execute confidentiality agreements with personnel

**Physical Safeguards:**
- Secure physical storage of printed records (locked cabinets)
- Controlled access to offices where data is processed
- Secure disposal of physical records (shredding)

### 5.2 Data Minimization
Each agency shall:
- Access only data necessary for their specific function
- Not download or copy data beyond operational requirements
- Request removal of access when personnel change roles or separate from service

### 5.3 Accuracy and Update
Each agency responsible for data entry shall:
- Verify accuracy of information before submission
- Promptly update records when inaccuracies are discovered
- Notify ICT Office of systemic data quality issues

## 6. Data Subject Rights

### 6.1 Handling Rights Requests
When a data subject exercises rights (access, rectification, erasure, objection):

1. **Initial Contact:** Data subject may contact any participating agency
2. **Referral:** Receiving agency notifies ICT Office within 24 hours
3. **Coordination:** ICT Office coordinates response among all agencies holding the data
4. **Response:** ICT Office provides consolidated response within 30 days

### 6.2 Right to Object
If a data subject objects to processing:
- Objection is logged and forwarded to ICT Office DPO
- Processing stops unless agency demonstrates compelling legal grounds
- Data subject is informed of decision within 15 days

### 6.3 Right to Erasure Limitations
Erasure requests may be denied if:
- Retention is required by law (disaster records, audits)
- Data is necessary for ongoing investigation or legal proceedings
- Erasure would prejudice public safety or disaster response capabilities

Partial erasure (redaction) may be offered where full erasure is not possible.

## 7. Data Breach Response

### 7.1 Incident Detection and Reporting

**Internal Notification (Within 24 Hours):**
- Agency discovering breach notifies ICT Office DPO immediately
- Preserve evidence; do not delete logs or records
- Begin containment measures

**Assessment (Within 48 Hours):**
- ICT Office assesses severity and impact
- Determines if breach meets NPC reporting threshold
- Coordinates with affected agencies

**NPC Notification (Within 72 Hours):**
- If risk to rights and freedoms, notify NPC per Circular 16-05
- Submit breach notification form with all required details

**Data Subject Notification (Without Undue Delay):**
- If high risk of harm, notify affected individuals
- Provide clear description of breach, consequences, mitigation

### 7.2 Breach Investigation
- ICT Office leads investigation with support from affected agencies
- Root cause analysis and corrective actions documented
- Post-incident report submitted to NPC within 30 days

### 7.3 Liability
- Agency responsible for breach bears liability and remediation costs
- Gross negligence may result in removal of CLIMA access
- Violations may be referred to NPC for administrative sanctions

## 8. Sub-Processing and Third-Party Services

### 8.1 Approved Sub-Processors

**ICT Office uses the following sub-processors:**

1. **Supabase Inc. (USA)** - Database and authentication
   - Safeguards: GDPR-compliant, ISO 27001, Standard Contractual Clauses
   - Data location: Singapore (Asia-Pacific region)

2. **Mapbox Inc. (USA)** - Mapping and geolocation services
   - Safeguards: GDPR-compliant, no personal data beyond coordinates
   - Data location: Global CDN

3. **KloudTech API (Southeast Asia)** - Weather data
   - Safeguards: Anonymous API calls, no personal information transmitted
   - Data location: Regional servers

### 8.2 Sub-Processor Requirements
All sub-processors must:
- Execute data processing agreements with equivalent protections
- Implement adequate technical and organizational measures
- Allow audits and inspections
- Notify ICT Office of any sub-sub-processors

### 8.3 New Sub-Processor Notification
ICT Office will notify agencies 30 days before engaging new sub-processors. Agencies may object if sub-processor does not meet DPA standards.

## 9. Audit and Compliance

### 9.1 Internal Audits
- ICT Office conducts annual internal audits of CLIMA data processing
- Participating agencies provide cooperation and documentation
- Audit findings shared with agency heads and DPOs

### 9.2 External Audits
- NPC may audit CLIMA at any time
- Commission on Audit (COA) may audit financial and operational records
- Agencies cooperate fully with auditors

### 9.3 Data Protection Impact Assessment (DPIA)
- ICT Office conducts DPIA annually or when significant changes occur
- DPIA covers risks to data subjects and mitigation measures
- Results shared with NPC if high residual risk identified

## 10. Training and Awareness

### 10.1 Mandatory Training
All personnel with access to CLIMA must complete:
- Data privacy fundamentals training (annually)
- CLIMA-specific security training (upon onboarding)
- Refresher training when significant changes occur

### 10.2 Training Content
- R.A. 10173 and NPC issuances
- Secure handling of personal information
- Recognizing and reporting security incidents
- Data subject rights and request handling

### 10.3 Training Records
- Agencies maintain training completion records
- Records available for audit

## 11. Data Retention and Disposal

### 11.1 Retention Schedule

| Data Type | Retention Period | Custodian | Disposal Method |
|-----------|------------------|-----------|-----------------|
| Incident reports | 7 years | ICT Office | Secure deletion + log |
| Operational logs | 2 years | Respective agency | Overwrite + log |
| Admin user accounts | Employment + 3 years | ICT Office | Anonymization |
| Audit trails | 5 years | ICT Office | Secure archival |
| Backups | 90 days | ICT Office | Encrypted overwrite |

### 11.2 Disposal Procedures
- Digital: Cryptographic erasure or multi-pass overwrite (DoD 5220.22-M standard)
- Physical: Cross-cut shredding or incineration with certificate of destruction
- Disposal logged with date, method, and personnel responsible

## 12. Termination and Withdrawal

### 12.1 Agency Withdrawal
An agency may withdraw from this DPA by providing 90 days' written notice to ICT Office. Upon withdrawal:
- Access credentials revoked immediately
- All data copies deleted within 30 days
- Certificate of deletion provided to ICT Office
- Historical records retained per legal requirements

### 12.2 Termination for Cause
ICT Office may terminate agency access for:
- Material breach of DPA
- Failure to remediate security vulnerabilities
- Unauthorized disclosure of personal information
- Refusal to cooperate with audits or investigations

### 12.3 CLIMA Platform Discontinuation
If CLIMA is discontinued:
- 180 days' advance notice to all agencies
- Data migration plan or secure disposal
- Compliance with retention requirements post-closure

## 13. Dispute Resolution

### 13.1 Internal Resolution
Disputes among agencies are resolved through:
1. Coordination at DPO level (15 days)
2. Escalation to agency heads (15 days)
3. Mediation by City Mayor's Office (30 days)

### 13.2 NPC Complaints
Any party may file a complaint with NPC if internal resolution fails or if violations of R.A. 10173 are suspected.

### 13.3 Governing Law
This DPA is governed by Philippine law and regulations. Venue is Palayan City courts.

## 14. Amendment and Review

### 14.1 Annual Review
This DPA is reviewed annually by all parties and updated to reflect:
- Changes in laws or NPC guidance
- New technologies or processing activities
- Lessons learned from incidents or audits

### 14.2 Amendment Process
- ICT Office proposes amendments with 30 days' notice
- Agencies provide feedback within 15 days
- Amendments effective upon majority consent (unless required by law)

## 15. Signatures and Effective Date

By accessing CLIMA and processing personal information therethrough, agency heads and designated DPOs acknowledge:
- They have read and understood this DPA
- They agree to comply with all terms and obligations
- They have authority to bind their agency to this agreement
- They will ensure personnel under their supervision comply

**This DPA is executed as of January 15, 2025, and remains in effect indefinitely until terminated in accordance with Section 12.**

---

**Authorized Signatories:**

**Palayan City ICT Office**  
Signature: ___________________________  
Name: [Name]  
Position: ICT Officer / Data Protection Officer  
Date: ___________________________

**City Disaster Risk Reduction and Management Office**  
Signature: ___________________________  
Name: [Name]  
Position: CDRRMO Head  
Date: ___________________________

**Bureau of Fire Protection - Palayan City**  
Signature: ___________________________  
Name: [Name]  
Position: Fire Marshal  
Date: ___________________________

**Palayan City Health Office**  
Signature: ___________________________  
Name: [Name]  
Position: City Health Officer  
Date: ___________________________

**Philippine National Police - Palayan City Station**  
Signature: ___________________________  
Name: [Name]  
Position: Chief of Police  
Date: ___________________________

**Department of Agriculture - Provincial Office**  
Signature: ___________________________  
Name: [Name]  
Position: Provincial Agriculturist  
Date: ___________________________

---

*This Data Processing Agreement is a legally binding document executed in accordance with the Data Privacy Act of 2012 (R.A. 10173) and National Privacy Commission guidelines. Copies are distributed to all participating agencies and filed with the City Legal Office.*
