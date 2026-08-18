import re
with open('src/main.tsx', 'r') as f:
    content = f.read()

# Replace the dispatchEvent inside the new button with our local logic if it wasn't replaced
pattern = re.compile(r'<button\n\s*onClick=\{\(\) => \{\n\s*window\.dispatchEvent\(new CustomEvent\(\'open-composer-modal\', \{ detail: \{ mode: \'upload\' \} \}\)\);\n\s*setTimeout\(\(\) => window\.dispatchEvent\(new CustomEvent\(\'open-composer-video\', \{\}\)\), 50\);\n\s*\}\}\n\s*className="primary-button"\n\s*style=\{\{ height: \'36px\', padding: \'0 16px\', borderRadius: \'4px\' \}\}\n\s*>\n\s*\+ Subir vídeo\n\s*</button>', re.DOTALL)
if pattern.search(content):
    print("Pattern matched, replacing it!")
    replacement = """<input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="video/mp4,video/webm,video/quicktime" onChange={handleFileSelect} />
        <button
          onClick={handleUploadClick}
          className="primary-button"
          style={{ height: '36px', padding: '0 16px', borderRadius: '4px' }}
        >
          + Subir vídeo
        </button>"""
    content = pattern.sub(replacement, content)
else:
    print("Pattern NOT matched")

with open('src/main.tsx', 'w') as f:
    f.write(content)
