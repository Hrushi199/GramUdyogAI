from fastapi import APIRouter, HTTPException, Query
from models.csr_dashboard import (
    CSREvent, CompanyCSRProfile, CSRDashboardMetrics, 
    init_csr_dashboard_db, populate_dummy_csr_data,
    CSREventType
)
import sqlite3
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

def get_db():
    return sqlite3.connect('gramudyogai.db')

@router.post("/dashboard/initialize")
async def initialize_csr_dashboard():
    """Initialize CSR dashboard with dummy data"""
    try:
        init_csr_dashboard_db()
        populate_dummy_csr_data()
        return {"message": "CSR dashboard initialized successfully with dummy data"}
    except Exception as e:
        logger.error(f"Error initializing CSR dashboard: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to initialize CSR dashboard")

@router.get("/dashboard/companies")
async def get_all_companies():
    """Get all companies registered for CSR"""
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute('SELECT * FROM csr_companies ORDER BY company_name')
        rows = cursor.fetchall()
        companies = []
        for row in rows:
            company = dict(zip([col[0] for col in cursor.description], row))
            company['csr_focus_areas'] = json.loads(company['csr_focus_areas'])
            companies.append(company)
        return companies
    except Exception as e:
        logger.error(f"Error fetching companies: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch companies")
    finally:
        conn.close()

@router.get("/dashboard/company/{company_id}")
async def get_company_profile(company_id: int):
    """Get detailed profile of a specific company"""
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute('SELECT * FROM csr_companies WHERE id = ?', (company_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Company not found")
        
        company = dict(zip([col[0] for col in cursor.description], row))
        company['csr_focus_areas'] = json.loads(company['csr_focus_areas'])
        return company
    except Exception as e:
        logger.error(f"Error fetching company profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch company profile")
    finally:
        conn.close()

@router.get("/dashboard/company/{company_id}/metrics")
async def get_company_dashboard_metrics(company_id: int):
    """Get comprehensive dashboard metrics for a specific company"""
    conn = get_db()
    cursor = conn.cursor()
    try:
        # Get company details
        cursor.execute('SELECT company_name FROM csr_companies WHERE id = ?', (company_id,))
        company_row = cursor.fetchone()
        if not company_row:
            raise HTTPException(status_code=404, detail="Company not found")
        
        company_name = company_row[0]
        
        # Get all events for this company
        cursor.execute('''
            SELECT * FROM csr_events 
            WHERE company_id = ? 
            ORDER BY start_date DESC
        ''', (company_id,))
        events = cursor.fetchall()
        
        if not events:
            return CSRDashboardMetrics(
                company_id=company_id,
                company_name=company_name,
                total_events=0,
                total_beneficiaries=0,
                total_budget_allocated=0.0,
                total_budget_spent=0.0,
                budget_efficiency=0.0,
                average_impact_score=0.0,
                events_by_type={},
                geographical_reach={},
                yearly_progress={},
                sustainability_score=0.0,
                community_feedback_score=0.0
            )
        
        # Calculate metrics
        total_events = len(events)
        total_beneficiaries = sum(event[8] for event in events)  # beneficiaries_count
        total_budget_allocated = sum(event[9] for event in events)  # budget_allocated
        total_budget_spent = sum(event[10] for event in events)  # budget_spent
        budget_efficiency = (total_budget_spent / total_budget_allocated * 100) if total_budget_allocated > 0 else 0
        
        # Events by type
        events_by_type = {}
        for event in events:
            event_type = event[4]  # event_type
            events_by_type[event_type] = events_by_type.get(event_type, 0) + 1
        
        # Geographical reach
        geographical_reach = {}
        for event in events:
            state = event[7]  # state
            geographical_reach[state] = geographical_reach.get(state, 0) + 1
        
        # Yearly progress
        yearly_progress = {}
        for event in events:
            year = event[11][:4]  # Extract year from start_date
            if year not in yearly_progress:
                yearly_progress[year] = {
                    "events": 0,
                    "beneficiaries": 0,
                    "budget_spent": 0,
                    "impact_score": 0
                }
            yearly_progress[year]["events"] += 1
            yearly_progress[year]["beneficiaries"] += event[8]
            yearly_progress[year]["budget_spent"] += event[10]
        
        # Calculate impact scores and sustainability
        impact_scores = []
        sustainability_scores = []
        
        for event in events:
            impact_metrics = json.loads(event[14]) if event[14] else {}  # impact_metrics
            
            # Calculate impact score based on beneficiaries and budget efficiency
            event_impact = (event[8] / 1000) * (event[10] / event[9]) * 100 if event[9] > 0 else 0
            impact_scores.append(min(event_impact, 100))
            
            # Calculate sustainability score based on event type and duration
            start_date = datetime.fromisoformat(event[11])
            end_date = datetime.fromisoformat(event[12])
            duration_days = (end_date - start_date).days
            
            sustainability_score = min((duration_days / 365) * 50 + 50, 100)
            sustainability_scores.append(sustainability_score)
        
        average_impact_score = sum(impact_scores) / len(impact_scores) if impact_scores else 0
        sustainability_score = sum(sustainability_scores) / len(sustainability_scores) if sustainability_scores else 0
        
        # Mock community feedback score (would come from actual feedback in real scenario)
        community_feedback_score = min(85 + (average_impact_score / 10), 100)
        
        return CSRDashboardMetrics(
            company_id=company_id,
            company_name=company_name,
            total_events=total_events,
            total_beneficiaries=total_beneficiaries,
            total_budget_allocated=total_budget_allocated,
            total_budget_spent=total_budget_spent,
            budget_efficiency=round(budget_efficiency, 2),
            average_impact_score=round(average_impact_score, 2),
            events_by_type=events_by_type,
            geographical_reach=geographical_reach,
            yearly_progress=yearly_progress,
            sustainability_score=round(sustainability_score, 2),
            community_feedback_score=round(community_feedback_score, 2)
        )
        
    except Exception as e:
        logger.error(f"Error calculating dashboard metrics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to calculate dashboard metrics")
    finally:
        conn.close()

@router.get("/dashboard/company/{company_id}/events")
async def get_company_events(
    company_id: int,
    event_type: Optional[CSREventType] = Query(None),
    state: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    limit: int = Query(10, ge=1, le=100)
):
    """Get events for a specific company with filtering options"""
    conn = get_db()
    cursor = conn.cursor()
    try:
        # Build query with filters
        query = "SELECT * FROM csr_events WHERE company_id = ?"
        params = [company_id]
        
        if event_type:
            query += " AND event_type = ?"
            params.append(event_type.value)
        
        if state:
            query += " AND state = ?"
            params.append(state)
        
        if year:
            query += " AND strftime('%Y', start_date) = ?"
            params.append(str(year))
        
        query += " ORDER BY start_date DESC LIMIT ?"
        params.append(limit)
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        events = []
        for row in rows:
            event = dict(zip([col[0] for col in cursor.description], row))
            event['impact_metrics'] = json.loads(event['impact_metrics']) if event['impact_metrics'] else {}
            events.append(event)
        
        return events
        
    except Exception as e:
        logger.error(f"Error fetching company events: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch company events")
    finally:
        conn.close()

@router.get("/dashboard/analytics/overview")
async def get_csr_analytics_overview():
    """Get overall CSR analytics across all companies"""
    conn = get_db()
    cursor = conn.cursor()
    try:
        # Total companies
        cursor.execute('SELECT COUNT(*) FROM csr_companies')
        total_companies = cursor.fetchone()[0]
        
        # Total events
        cursor.execute('SELECT COUNT(*) FROM csr_events')
        total_events = cursor.fetchone()[0]
        
        # Total beneficiaries
        cursor.execute('SELECT SUM(beneficiaries_count) FROM csr_events')
        total_beneficiaries = cursor.fetchone()[0] or 0
        
        # Total budget
        cursor.execute('SELECT SUM(budget_allocated), SUM(budget_spent) FROM csr_events')
        budget_row = cursor.fetchone()
        total_budget_allocated = budget_row[0] or 0
        total_budget_spent = budget_row[1] or 0
        
        # Top performing companies by impact
        cursor.execute('''
            SELECT company_name, SUM(beneficiaries_count) as total_beneficiaries,
                   COUNT(*) as total_events, AVG(budget_spent/budget_allocated*100) as efficiency
            FROM csr_events 
            GROUP BY company_id, company_name
            ORDER BY total_beneficiaries DESC, efficiency DESC
            LIMIT 5
        ''')
        top_companies = []
        for row in cursor.fetchall():
            top_companies.append({
                "company_name": row[0],
                "total_beneficiaries": row[1],
                "total_events": row[2],
                "efficiency": round(row[3], 2) if row[3] else 0
            })
        
        # Events by type across all companies
        cursor.execute('''
            SELECT event_type, COUNT(*) as count, SUM(beneficiaries_count) as beneficiaries
            FROM csr_events 
            GROUP BY event_type
            ORDER BY count DESC
        ''')
        events_by_type = {}
        for row in cursor.fetchall():
            events_by_type[row[0]] = {
                "count": row[1],
                "beneficiaries": row[2]
            }
        
        # Geographical distribution
        cursor.execute('''
            SELECT state, COUNT(*) as events, SUM(beneficiaries_count) as beneficiaries
            FROM csr_events 
            GROUP BY state
            ORDER BY events DESC
            LIMIT 10
        ''')
        geographical_distribution = {}
        for row in cursor.fetchall():
            geographical_distribution[row[0]] = {
                "events": row[1],
                "beneficiaries": row[2]
            }
        
        return {
            "total_companies": total_companies,
            "total_events": total_events,
            "total_beneficiaries": total_beneficiaries,
            "total_budget_allocated": total_budget_allocated,
            "total_budget_spent": total_budget_spent,
            "overall_efficiency": round((total_budget_spent / total_budget_allocated * 100), 2) if total_budget_allocated > 0 else 0,
            "top_companies": top_companies,
            "events_by_type": events_by_type,
            "geographical_distribution": geographical_distribution
        }
        
    except Exception as e:
        logger.error(f"Error fetching CSR analytics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch CSR analytics")
    finally:
        conn.close()

@router.get("/dashboard/leaderboard")
async def get_csr_leaderboard():
    """Get CSR leaderboard ranking companies by various metrics"""
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            SELECT 
                c.company_name,
                c.industry,
                c.csr_rating,
                COUNT(e.id) as total_events,
                SUM(e.beneficiaries_count) as total_beneficiaries,
                SUM(e.budget_spent) as total_budget_spent,
                AVG(e.budget_spent/e.budget_allocated*100) as budget_efficiency,
                COUNT(DISTINCT e.state) as states_covered
            FROM csr_companies c
            LEFT JOIN csr_events e ON c.id = e.company_id
            GROUP BY c.id, c.company_name, c.industry, c.csr_rating
            ORDER BY total_beneficiaries DESC, budget_efficiency DESC
        ''')
        
        leaderboard = []
        for i, row in enumerate(cursor.fetchall(), 1):
            leaderboard.append({
                "rank": i,
                "company_name": row[0],
                "industry": row[1],
                "csr_rating": row[2],
                "total_events": row[3] or 0,
                "total_beneficiaries": row[4] or 0,
                "total_budget_spent": row[5] or 0,
                "budget_efficiency": round(row[6], 2) if row[6] else 0,
                "states_covered": row[7] or 0
            })
        
        return leaderboard
        
    except Exception as e:
        logger.error(f"Error fetching CSR leaderboard: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch CSR leaderboard")
    finally:
        conn.close()

@router.get("/dashboard/events/recent")
async def get_recent_csr_events(limit: int = Query(20, ge=1, le=100)):
    """Get recent CSR events across all companies"""
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            SELECT * FROM csr_events 
            ORDER BY created_at DESC 
            LIMIT ?
        ''', (limit,))
        
        events = []
        for row in cursor.fetchall():
            event = dict(zip([col[0] for col in cursor.description], row))
            event['impact_metrics'] = json.loads(event['impact_metrics']) if event['impact_metrics'] else {}
            events.append(event)
        
        return events
        
    except Exception as e:
        logger.error(f"Error fetching recent events: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch recent events")
    finally:
        conn.close()

@router.get("/dashboard/search")
async def search_csr_events(
    query: str = Query(..., min_length=2),
    event_type: Optional[CSREventType] = Query(None),
    state: Optional[str] = Query(None),
    limit: int = Query(10, ge=1, le=50)
):
    """Search CSR events by title, description, or company name"""
    conn = get_db()
    cursor = conn.cursor()
    try:
        # Build search query
        search_query = '''
            SELECT * FROM csr_events 
            WHERE (event_title LIKE ? OR description LIKE ? OR company_name LIKE ?)
        '''
        params = [f'%{query}%', f'%{query}%', f'%{query}%']
        
        if event_type:
            search_query += ' AND event_type = ?'
            params.append(event_type.value)
        
        if state:
            search_query += ' AND state = ?'
            params.append(state)
        
        search_query += ' ORDER BY start_date DESC LIMIT ?'
        params.append(limit)
        
        cursor.execute(search_query, params)
        
        events = []
        for row in cursor.fetchall():
            event = dict(zip([col[0] for col in cursor.description], row))
            event['impact_metrics'] = json.loads(event['impact_metrics']) if event['impact_metrics'] else {}
            events.append(event)
        
        return events
        
    except Exception as e:
        logger.error(f"Error searching CSR events: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to search CSR events")
    finally:
        conn.close()
