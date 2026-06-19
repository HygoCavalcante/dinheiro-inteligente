import os, glob

artigos = glob.glob("artigos/*.html")

disclaimer = '  <div class="disclaimer" style="max-width:1100px;margin:0 auto 20px;padding:0 20px">\n    ⚠️ <strong>Aviso legal:</strong> O conteúdo deste blog tem caráter educativo e informativo. Não constitui recomendação de investimento.\n  </div>\n'

for filepath in artigos:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    changed = False

    # Fix logo emoji
    if '🤑 <span>Fique Rico</span>Agora' in content:
        content = content.replace('🤑 <span>Fique Rico</span>Agora', '💰 <span>Fique Rico</span>Agora')
        changed = True

    # Add disclaimer if missing
    if 'Aviso legal' not in content and 'disclaimer' not in content:
        footer_marker = '  <div class="footer-bottom"'
        if footer_marker in content:
            content = content.replace(footer_marker, disclaimer + footer_marker, 1)
            changed = True

    if changed:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"OK: {filepath}")
    else:
        print(f"skip: {filepath}")

print("\nConcluido!")
