#!/usr/bin/env python3

import sys
import sqlite3
from init_db import load_all_skill_india_data

def main():
    # Load all Skill India data with apply URLs
    print('Loading Skill India data with apply URLs...')
    load_all_skill_india_data()

    print('Import completed! Checking results...')

    # Check the results
    conn = sqlite3.connect('gramudyogai.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Get total count
    cursor.execute('SELECT COUNT(*) FROM job_postings')
    total_jobs = cursor.fetchone()[0]

    # Get count with URLs
    cursor.execute("SELECT COUNT(*) FROM job_postings WHERE apply_url IS NOT NULL AND apply_url != ''")
    jobs_with_urls = cursor.fetchone()[0]

    print(f'Total jobs: {total_jobs}')
    print(f'Jobs with apply URLs: {jobs_with_urls}')

    # Show sample jobs with apply URLs
    cursor.execute("SELECT job_title, company, apply_url FROM job_postings WHERE apply_url IS NOT NULL AND apply_url != '' LIMIT 3")
    sample_jobs = cursor.fetchall()
    
    print('\nSample jobs with apply URLs:')
    for job in sample_jobs:
        print(f'  {job[0]} at {job[1]}')
        print(f'    Apply URL: {job[2][:80]}...')

    conn.close()
    print('\nAll apply URLs imported successfully!')

if __name__ == "__main__":
    main()
