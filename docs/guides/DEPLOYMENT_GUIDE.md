# CLIMA Project - Deployment & Implementation Guide

## 🎉 Project Completion Summary

All major phases have been implemented! Here's what was delivered:

### ✅ Phase 10 - GIS Expansion
- **Barangay boundaries layer** with toggle controls
- **Incident heatmap** visualization
- **Hospital locations** with capacity info
- **Tourism layers** (Hotels, Restaurants, Attractions)
- **Layer control panel** with categories and visibility management
- **Dynamic data loading** from Supabase and GeoJSON files

### ✅ Phase 4 - Facebook Integration
- **Database schema** for Facebook posts and keywords
- **Keyword detection system** with auto-categorization
- **Moderation queue UI** (FacebookModerationScreen)
- **Webhook endpoint guide** with implementation examples
- **Auto-publishing workflow** for advisories
- **Configuration tables** for API credentials

### ✅ Phase 11 - Inter-Agency Intelligence
- **Utility conflict detection** (power/water outage impact analysis)
- **Hospital dependency monitoring** (critical facility tracking)
- **Concurrent incident detection** (spatial clustering)
- **Automated alert generation** with database triggers
- **Intelligence dashboard UI** (IntelligenceDashboard.jsx)
- **Inter-agency notifications** system

### ✅ Phase 12 - Reporting & Analytics
- **Executive dashboard** with comprehensive charts
- **Heat index analytics** (Recharts visualizations)
- **Incident trend analysis** (daily/weekly/monthly)
- **Category breakdown** (pie charts)
- **Hospital case tracking** (bar charts)
- **PDF export** functionality (jsPDF)
- **CSV/Excel export** for reports
- **Date range filtering** (7/30/90/365 days)

### ✅ Security Hardening
- **XSS protection** (input sanitization)
- **CSRF tokens** generation and validation
- **Rate limiting** (login attempts, report submissions)
- **Password strength validation** (complexity requirements)
- **Email verification** tokens table
- **MFA support** (Supabase Auth integration)
- **Audit logging** (security events tracking)
- **Session management** (timeout and cleanup)
- **Suspicious activity detection** (location-based alerts)
- **Webhook signature validation** (Facebook, etc.)
- **SQL injection protection** (parameterized queries guide)
- **Secure cookie configuration**

---

## 📋 Deployment Checklist

### 1. Database Setup

Run all SQL migration files in order:

```bash
# Connect to your Supabase project
psql -h your-supabase-host -U postgres -d postgres

# Run migrations in order
\i supabase_phase1.sql
\i supabase_phase3.sql
\i supabase_phase4.sql
\i supabase_phase5.sql
\i supabase_phase11.sql
\i supabase_security.sql
```

**Verify RLS is enabled on all tables:**
```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

### 2. Environment Variables

Create/update `.env` file:

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Mapbox
VITE_MAPBOX_TOKEN=your-mapbox-token

# Facebook (Phase 4)
VITE_FB_APP_ID=your-fb-app-id
VITE_FB_APP_SECRET=your-fb-app-secret
VITE_FB_PAGE_ID=your-fb-page-id
VITE_FB_PAGE_ACCESS_TOKEN=your-page-access-token
VITE_FB_VERIFY_TOKEN=your-random-verify-token
```

### 3. Supabase Configuration

**Enable these settings in Supabase Dashboard:**

1. **Authentication:**
   - Enable Email/Password authentication
   - Enable email confirmations
   - Set up MFA (optional but recommended)
   - Configure password strength requirements
   - Enable rate limiting

2. **Storage:**
   - Create bucket: `report-images` (public read)
   - Set max file size: 5MB
   - Allowed MIME types: image/jpeg, image/png, image/webp

3. **Database:**
   - Verify all RLS policies are active
   - Set up scheduled jobs for cleanup functions:
     - `SELECT cleanup_expired_sessions();` (daily)
     - `SELECT cleanup_expired_tokens();` (daily)

4. **API:**
   - Enable CORS for your domain
   - Set rate limits for API endpoints

### 4. Facebook Integration (Phase 4)

**If using Facebook monitoring:**

1. Create Facebook App at https://developers.facebook.com/
2. Add Webhooks product
3. Deploy webhook server (see `facebook_webhook.md`)
4. Configure webhook URL in Facebook App settings
5. Subscribe to page events: feed, comments, mentions
6. Insert credentials into `facebook_config` table:

```sql
INSERT INTO facebook_config (
    page_id,
    page_access_token,
    app_id,
    app_secret,
    verify_token,
    is_active
) VALUES (
    'YOUR_PAGE_ID',
    'YOUR_PAGE_ACCESS_TOKEN',
    'YOUR_APP_ID',
    'YOUR_APP_SECRET',
    'YOUR_VERIFY_TOKEN',
    TRUE
);
```

### 5. Sample Data Setup

**Populate agency dependencies for Phase 11:**

```sql
-- Example: Hospital depends on power feeder
INSERT INTO agency_dependencies (
    dependent_facility_type,
    dependent_facility_id,
    dependency_type,
    utility_facility_type,
    utility_facility_id,
    criticality
) VALUES (
    'hospital',
    (SELECT id FROM hospitals WHERE name = 'City General Hospital'),
    'power',
    'power_feeder',
    (SELECT id FROM power_feeders WHERE name = 'Feeder A'),
    'critical'
);

-- Add more dependencies as needed
```

### 6. Build & Deploy

**Development:**
```bash
npm install
npm run dev
```

**Production Build:**
```bash
npm run build
```

**Deploy to hosting (choose one):**

- **Vercel:** `vercel deploy`
- **Netlify:** `netlify deploy --prod`
- **Firebase:** `firebase deploy`
- **Custom server:** Copy `dist/` folder to web server

### 7. Post-Deployment Testing

Test these critical features:

- [ ] User registration and login
- [ ] Report submission with image upload
- [ ] Map layers toggle (barangays, heatmap, hospitals)
- [ ] Admin dashboard access
- [ ] Facebook moderation queue (if enabled)
- [ ] Intelligence alerts generation
- [ ] Executive dashboard analytics
- [ ] PDF/CSV export functionality
- [ ] Rate limiting on login attempts
- [ ] Email verification flow
- [ ] Session timeout handling

---

## 🔒 Security Recommendations

### Production Requirements

1. **HTTPS Only**
   - Force HTTPS redirects
   - Set `Strict-Transport-Security` header

2. **Content Security Policy**
   - Implement CSP headers (see `src/lib/security.js`)
   - Restrict script sources

3. **Authentication**
   - Enable MFA for admin accounts
   - Require email verification for new users
   - Implement password reset flow
   - Monitor failed login attempts

4. **Data Protection**
   - Regular database backups
   - Encrypt sensitive data at rest
   - Implement data retention policies
   - GDPR compliance measures

5. **Monitoring**
   - Set up error tracking (Sentry, LogRocket)
   - Monitor security_events table
   - Alert on suspicious activities
   - Track API usage and rate limits

---

## 🚀 New Features Usage

### GIS Layers (Phase 10)

The map now has a **Layers** button in the top-right corner:

1. Click "Layers" to open the control panel
2. Expand categories to see available layers
3. Toggle individual layers on/off
4. Layers include:
   - Barangay boundaries
   - Incident heatmap
   - Report pins
   - Hospitals
   - Fire stations (ready for data)
   - Evacuation centers (ready for data)
   - Water facilities (ready for data)
   - Power feeders (ready for data)
   - Tourism spots

### Facebook Moderation (Phase 4)

Access via admin panel:

1. Navigate to Facebook Moderation screen
2. View pending posts detected by keywords
3. Review post content and detected category
4. Click **Approve** to convert to incident report
5. Click **Reject** to dismiss (optionally add reason)
6. Approved posts automatically create reports

### Intelligence Dashboard (Phase 11)

Access via admin panel:

1. View active conflict alerts
2. See utility outage impacts on hospitals
3. Monitor concurrent incident clusters
4. Acknowledge or resolve alerts
5. Read inter-agency notifications

### Executive Dashboard (Phase 12)

Access via admin panel:

1. Select date range (7/30/90/365 days)
2. View analytics charts:
   - Incident trends over time
   - Category breakdown
   - Hospital cases
   - Heat index analytics
3. Export to PDF or CSV
4. Share reports with stakeholders

---

## 🐛 Troubleshooting

### Common Issues

**Map not loading:**
- Check `VITE_MAPBOX_TOKEN` in `.env`
- Verify Mapbox account is active
- Check browser console for errors

**Database connection failed:**
- Verify Supabase credentials
- Check if project is paused (free tier)
- Ensure RLS policies allow access

**Images not uploading:**
- Verify storage bucket exists
- Check bucket permissions
- Ensure file size < 5MB

**Facebook webhook not working:**
- Verify verify_token matches
- Check webhook URL is publicly accessible
- Review App Permissions in Facebook Dashboard

**Analytics showing no data:**
- Ensure date range includes actual data
- Check if database has sample reports
- Verify Supabase functions are working

---

## 📚 Additional Resources

- **Supabase Docs:** https://supabase.com/docs
- **Mapbox GL JS:** https://docs.mapbox.com/mapbox-gl-js/
- **Facebook Graph API:** https://developers.facebook.com/docs/graph-api
- **Recharts:** https://recharts.org/
- **jsPDF:** https://github.com/parallax/jsPDF

---

## 📞 Support & Maintenance

### Maintenance Tasks

**Weekly:**
- Review security_events for suspicious activity
- Check Facebook moderation queue
- Monitor conflict alerts

**Monthly:**
- Update dependencies: `npm update`
- Review and archive old reports
- Verify backup integrity
- Check storage usage

**Quarterly:**
- Audit user permissions
- Review and update keywords (Facebook)
- Test disaster recovery procedures
- Security audit

---

## 🎯 Next Steps (Future Enhancements)

While all major phases are complete, consider these additions:

1. **Mobile App** (React Native version)
2. **SMS Alerts** (Twilio integration)
3. **Voice Reports** (Speech-to-text)
4. **AR Navigation** (augmented reality for evacuation routes)
5. **Predictive Analytics** (ML-based incident prediction)
6. **Multi-language Support** (i18n)
7. **Offline Mode** (PWA enhancements)
8. **Public API** (for third-party integrations)

---

## ✅ Project Status

**All phases complete and production-ready!**

- ✅ Phase 1-3: Backend Foundation (completed previously)
- ✅ Phase 4: Facebook Integration
- ✅ Phase 5-9: Agency Modules (completed previously)
- ✅ Phase 10: GIS Expansion
- ✅ Phase 11: Inter-Agency Intelligence
- ✅ Phase 12: Reporting & Analytics
- ✅ Security: Comprehensive hardening

**Ready for deployment!** 🚀
