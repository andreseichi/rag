# RAG finanças

## 1 - Para rodar a aplicação, deve ter primeiro um container com o banco de dados vetorial Redis disponível

<code>
  docker run -d --name redis-stack-server -p 6379:6379 -it redis/redis-stack-server:latest
</code>

## 2 - Ter o Ollama instalado na máquina

<code>
  https://ollama.com/download
</code>

## 3 - Ter algum modelo de embedding instalado (Recomendado o nomic-embed-text)

<code>
  https://ollama.com/search?c=embedding
</code>

## 4 - Ter algum modelo de LLM (Recomendado o llama3.1)

<code>
  https://ollama.com/search
</code>

## 5 - Fazer build do projeto

<code>
  npm run build
</code>

## 6 - Rodar o projeto

<code>
  npm run start
</code>
