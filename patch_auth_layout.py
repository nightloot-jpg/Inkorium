import re

with open('src/layouts/AuthLayout.tsx', 'r') as f:
    content = f.read()

replacement = """
  if (isLoginRoute) {
    return (
      <div className="ik-login-page">
        <div className="ik-login-wrapper">
          <div className="ik-login-logo">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDh21j_EsxY-EHMnu9xhZtPSz5YQfwkXZ4S_xxWcNjGNc6cyd781tFfLlj7eJRT4BjyfBEbSp64wFH4vhu4Lbwkr_gG5UcEZDKKSJb6v-jlyqPTGH41GMGkBVBr-Bgxt6MHr9OHBWN44oJ9BHKQRRw8IvQFQ4abAKjf7nM3vCzAE_sLFrVmGdSBWkOxjZpPJGoFsv2zd9dwqQnyksVUB4Ln_ZXghRi-wti-IBI9nX0iWqcZXlFNwi5i5Bt6rVJTbpmUpg"
              alt="Inkorium"
            />
          </div>
          {children}
        </div>
      </div>
    );
  }
"""

pattern = r"  if \(isLoginRoute\) \{.*?    \);\n  \}"

new_content = re.sub(pattern, replacement.strip('\n'), content, flags=re.DOTALL)

with open('src/layouts/AuthLayout.tsx', 'w') as f:
    f.write(new_content)
