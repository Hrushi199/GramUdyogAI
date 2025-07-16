#!/usr/bin/env python3

import json
import sqlite3

def check_json_status():
    # Check how many jobs are in the original JSON file
    with open('skill_india_all_jobs.json', 'r', encoding='utf-8') as f:
        jobs_data = json.load(f)

    print(f'Total jobs in JSON file: {len(jobs_data)}')

    # Check if all have apply_url
    jobs_with_urls = sum(1 for job in jobs_data if job.get('apply_url'))
    print(f'Jobs with apply_url in JSON: {jobs_with_urls}')

    # Show a few apply URLs from JSON
    print('\nSample apply URLs from JSON:')
    for i, job in enumerate(jobs_data[:3]):
        if job.get('apply_url'):
            print(f'  {job.get("job_title", "Unknown")} - {job["apply_url"][:80]}...')

    # Check database status
    conn = sqlite3.connect('gramudyogai.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute('SELECT COUNT(*) FROM job_postings')
    db_total = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM job_postings WHERE apply_url IS NOT NULL AND apply_url != ''")
    db_with_urls = cursor.fetchone()[0]

    print(f'\nDatabase status:')
    print(f'Total jobs in database: {db_total}')
    print(f'Jobs with apply URLs in database: {db_with_urls}')

    conn.close()

if __name__ == "__main__":
    check_json_status()
