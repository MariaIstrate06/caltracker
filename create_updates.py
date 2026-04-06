import sys

# Read HTML
with open('src/app/app.component.html', 'r') as f:
    lines = f.readlines()

# Insert drink button after "Add existing meal"  button
result_html = []
for i, line in enumerate(lines):
    result_html.append(line)
    if 'Add existing meal' in line and i < len(lines) - 1 and '</div>' in lines[i+1]:
        # We found it, prepare for next iteration
        pass

# Write back
with open('src/app/app.component.html', 'w') as f:
    f.writelines(result_html)

print("Updated")
