import csv
import sys
from collections import defaultdict

csv_file_path = '/Users/i2carvajal/Documents/Proyectos/The Core/corporate_contacts_master.csv'

def normalize(val):
    if not val:
        return ""
    return val.strip().lower()

try:
    with open(csv_file_path, mode='r', encoding='utf-8') as f:
        reader = csv.reader(f)
        rows = list(reader)
        
    if not rows:
        print("CSV is empty.")
        sys.exit(1)
        
    headers = rows[0]
    data_rows = rows[1:]
    
    print(f"--- CSV Analysis: corporate_contacts_master.csv ---")
    print(f"Total Rows (excluding header): {len(data_rows)}")
    print(f"Headers found: {headers}")
    
    # Map headers to indices
    col_idx = {h: idx for idx, h in enumerate(headers)}
    
    first_name_idx = col_idx.get('First Name', -1)
    last_name_idx = col_idx.get('Last Name', -1)
    email_idx = col_idx.get('Email', -1)
    company_idx = col_idx.get('Company', -1)
    role_idx = col_idx.get('Job Title', -1)
    
    if first_name_idx == -1:
        print("Error: 'First Name' column not found in CSV.")
        sys.exit(1)
        
    valid_contacts = []
    missing_name_count = 0
    
    # Track duplicates
    by_name = defaultdict(list)
    by_email = defaultdict(list)
    
    for idx, r in enumerate(data_rows):
        if len(r) <= first_name_idx:
            missing_name_count += 1
            continue
            
        first_name = r[first_name_idx].strip()
        last_name = r[last_name_idx].strip() if last_name_idx != -1 and len(r) > last_name_idx else ""
        
        name = f"{first_name} {last_name}".strip()
        if not name:
            missing_name_count += 1
            continue
            
        email = r[email_idx].strip() if email_idx != -1 and len(r) > email_idx else ""
        company = r[company_idx].strip() if company_idx != -1 and len(r) > company_idx else ""
        role = r[role_idx].strip() if role_idx != -1 and len(r) > role_idx else ""
        
        contact_info = {
            'row_num': idx + 2, # 1-based, plus 1 for header
            'name': name,
            'email': email,
            'company': company,
            'role': role
        }
        
        valid_contacts.append(contact_info)
        
        norm_name = normalize(name)
        norm_email = normalize(email)
        
        by_name[norm_name].append(contact_info)
        if norm_email:
            by_email[norm_email].append(contact_info)
            
    print(f"Rows missing a name (skipped): {missing_name_count}")
    print(f"Total valid contacts (with names): {len(valid_contacts)}")
    
    # Count duplicate names
    dup_names = {k: v for k, v in by_name.items() if len(v) > 1}
    dup_emails = {k: v for k, v in by_email.items() if len(v) > 1}
    
    print(f"\n--- Duplicate Statistics ---")
    print(f"Unique names: {len(by_name)}")
    print(f"Contacts sharing a name with another row: {sum(len(v) for v in dup_names.values())} contacts ({len(dup_names)} distinct names)")
    print(f"Contacts sharing an email with another row: {sum(len(v) for v in dup_emails.values())} contacts ({len(dup_emails)} distinct emails)")
    
    print(f"\n--- Top 5 Duplicate Names Examples ---")
    sorted_dup_names = sorted(dup_names.items(), key=lambda x: -len(x[1]))[:5]
    for name, occurrences in sorted_dup_names:
        print(f"  • '{occurrences[0]['name']}' ({len(occurrences)} occurrences):")
        for occ in occurrences:
            print(f"      - Row {occ['row_num']}: Company: '{occ['company']}', Email: '{occ['email']}'")
            
    print(f"\n--- Top 5 Duplicate Emails Examples ---")
    sorted_dup_emails = sorted(dup_emails.items(), key=lambda x: -len(x[1]))[:5]
    for email, occurrences in sorted_dup_emails:
        print(f"  • '{occurrences[0]['email']}' ({len(occurrences)} occurrences):")
        for occ in occurrences:
            print(f"      - Row {occ['row_num']}: Name: '{occ['name']}', Company: '{occ['company']}'")

except Exception as e:
    print(f"Error running analysis: {e}")
