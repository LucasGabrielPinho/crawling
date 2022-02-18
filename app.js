const puppeteer = require('puppeteer');
const fs = require('fs');
const express = require('express')
const app = express()
const port = 3000

var dados
var vagasObj = new Object();

const pesquisarVagas = async (urlVaga) => {
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768});
    await page.goto(urlVaga.url);

    dados = await page.evaluate(() => {
        const nodeList = document.querySelectorAll('.feature > a')
        const listArray = [...nodeList]
        const list = listArray.map( ({href}) => ({href}) )
        return list
    });

    await browser.close();
    return dados;
};

const detalheVaga = async (urlVaga) => {
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768});

    for (let i = 0; i < urlVaga.length; i++) {
        let url = urlVaga[i].href
        console.log(url);
        await page.goto(url);
        
        const vaga = await page.evaluate(() => {
            let vaga = new Object();
            let tags = new Object();

            let nomeEmpresa   = document.querySelector('.company-card h2 a')
            let localEmpresa  = document.querySelector('.company-card > h3')
            let tagsVaga      = document.querySelectorAll('.listing-header-container .listing-tag')
            let descVaga      = document.querySelector('#job-listing-show-container')
            let dataVaga      = document.querySelector('.listing-header-container time')

            nomeEmpresa     = nomeEmpresa ? nomeEmpresa.innerText : 'Empresa desconhecida'
            localEmpresa    = localEmpresa ? localEmpresa.innerText : 'Sem localização'
            descVaga        = descVaga ? descVaga.innerHTML : 'Sem descrição'
            dataVaga        = dataVaga ? dataVaga.dateTime : 'Sem data'
        
            for (let index = 0; index < tagsVaga.length; index++) {
                tags[index] = tagsVaga[index].innerText;
            }
        
            vaga.empresa   = nomeEmpresa;
            vaga.local     = localEmpresa;
            vaga.tags      = tags;
            vaga.descricao = descVaga;
            vaga.data      = dataVaga;
        
            return vaga;
        });   
        
        vagasObj[i] = vaga;
    }  

    await browser.close();
    return vagasObj;
};

function criarJson(vagasObj) {
    fs.writeFile('vaga-weworkremotely.json', JSON.stringify(vagasObj, null, 2),
        err => {
            if (err)
                throw new Error('Azedou a marmita');
        }
    );

    return console.log();
}

app.get('/api/:url?', async(req, res) => {
    const url = req.query;
    await pesquisarVagas(url);
    await detalheVaga(dados);
    await criarJson(vagasObj);
    await res.json(vagasObj);
})

app.listen(port, () => {
    console.log(`listening at htpp://localhost:${port}`);
})