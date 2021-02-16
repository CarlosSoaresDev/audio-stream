const http = require('http');
const fs = require('fs');
const getStat = require('util').promisify(fs.stat);


http.createServer(async(req, res) => {
    // diretorio do arquivo
    const filePath = `./static/musicFile-1610469542608.mp3`;
    // pega o estado do arquivo 
    const stat = await getStat(filePath);

    // Instruções de tamanho o padrao aqui é 1024 * 1024 1048576
    let chunkSize = 1024 * 1024;
    // Buffer: quanto de dados você vai querer enviar por pacotes
    let highWaterMark = 128;
    // caso o tamanho do arquivo for maior que 2097152 entao o chunkSize sera  
    // o valor do tamanho do arquivo * 0.25
    if (stat.size > chunkSize * 2) { chunkSize = Math.ceil(stat.size * 0.25); }
    // Pega a requisição header.ranger e formata e separa o valores em um array com dois indeces
    let option = req.headers.range ? req.headers.range.replace(/bytes=/, "").split("-") : [];

    option[0] = option[0] ? parseInt(option[0], 10) : 0;
    option[1] = option[1] ? parseInt(option[1], 10) : option[0] + chunkSize;
    option[1] > (stat.size - 1) ? option[1] = (stat.size - 1) : stat.size;
    //passando opções para ler 
    option = { start: option[0], end: option[1], highWaterMark };
    // Log da options para acompanhamento de pacotes
    console.log(option);
    // Ler o arquivo
    const stream = fs.createReadStream(filePath, option);
    // Passando informações via headers
    res.writeHead(206, {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': 0,
        'Content-Type': 'audio/mp3',
        'Accept-Ranges': 'bytes',
        'Content-Range': `bytes ${option.start}-${option.end}/${stat.size}`,
        'Content-Length': (option.end - option.start + 1)
    });
    // Cria o stream
    stream.pipe(res);
    // Observa se a stream foi finalizada e printa um log 
    // Neste exemplo sempre que enviar um pacote de dados encerra um stream
    stream.on('end', () => {
        console.log('Sucesso de stream file : ' + filePath)
    });
    // Observa se ouve erro e printa um log
    stream.on('error', (error) => {
        console.log('Error de stream : ' + error)
    })
}).listen(3002);