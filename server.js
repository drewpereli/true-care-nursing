// const formData = require("express-form-data");
require('dotenv').config();
const path = require('path');
const fileUpload = require('express-fileupload');
const mail = require('./mail');
const express = require('express');
const sendmail = require('sendmail')({ silent: false, devPort: 1025 })
const app = express();
const nodeEnv = process.env.NODE_ENV;
if (!['production', 'development'].includes(nodeEnv)) throw new Error('Node env is ' + nodeEnv + ', expected development or production');
const port = nodeEnv === 'production' ? 8888 : 3001;
app.set('view engine', 'pug');
app.set('views', './views');
app.locals.basedir = app.get('views');
app.use(express.static('public'));
// app.use(formData.parse());
// app.use(formData.format());
app.use(express.urlencoded());
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: process.env.TMP
}));
const contactInfo = {
    emergencyStaffingPhones: ['626-818-2420', '316-337-5559'],
    addresses: [
        {
            street: "4601 E Douglas Avenue Ste 201",
            city: "Wichita",
            state: "KS",
            zip: "67218",
            phone: "316-337-5559",
            fax: "316-337-5558"
        },
        {
            street: "810 S Flower St",
            city: "Los Angeles",
            state: "CA",
            zip: "90017",
            phone: "626-818-2420",
            fax: "213-265-7464"
        },
	{
		            street: "111 W 10th St",
		            city: "Kansas City",
		            state: "MO",
		            zip: "64105",
		            phone: "816-705-1460",
		            fax: "816-705-1461"
		        },
    ],
    applicantEmail: 'marketing.truecarenursing@gmail.com',
    clientEmail: 'info.truecarenursing@gmail.com',
    socialMediaURLs: {
        'instagram': 'https://www.instagram.com/truecare.nursing/',
        'facebook': 'https://www.facebook.com/Truecare-Nursing-Sevices-965055063667660/',
        'twitter': 'https://twitter.com/truecarenursing'
    }
}

const routes = [
    {route: '', view: 'index'},
    {route: 'about'},
    { route: 'apply', include: ['labelify'], post: true, email: contactInfo.applicantEmail },
    { route: 'inquire', include: ['labelify'], post: true, email: contactInfo.applicantEmail},
    { route: 'hire', include: ['labelify'], post: true, email: contactInfo.clientEmail}
];


const includes = {
    labelify(str){
        const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);
        return str.split('-').map(capitalize).join(' ');
    }
}


for (route of routes){
    const path = '/' + route.route;
    const view = route.view || route.route;
    const vars = {
        pages: [
            { title: 'About', path: '/about' },
            { title: 'Find Staffing', path: '/hire' },
            { title: 'Opportunities', path: '/apply' },
            {title: 'Inquiries', path: '/inquire'}
        ],
        contactInfo
    };
    if (route.include) for (inc of route.include) vars[inc] = includes[inc];
    app.get(path, (req, res) => {
        // console.log('received request');
        res.render(view, vars);
    }); 
    if(route.post){
        const currEmail = route.email;
        // console.log(currEmail);
        app.post(path, function(req, res) {
            // console.log(route);
            const to = currEmail;
            // console.log(currEmail);
            // const to = 'drewpereli@gmail.com';
            let body = '';
            let html = '';
            const attachments = [];
            Object.keys(req.body).forEach(key => {
                const data = req.body[key];
                body += `${key}: ${data}\n`;
                html += `<div>${key}: ${data}</div>`;
            });
            if (req.files){
                Object.keys(req.files).forEach(key => {
                    const fileInfo = req.files[key];
                    console.log(fileInfo);
                    attachments.push({
                        filename: fileInfo.name,
                        path: fileInfo.tempFilePath
                    });
                });
            }
            mail.sendMessage({
                to,
                subject: 'New Applicant',
                body,
                html,
                attachments
            })
            .then(() => {
                vars.flash = {
                    type: 'success',
                    message: 'Application Submitted!'
                };
            })
            .catch(err => {
                vars.flash = {
                    type: 'error',
                    message: 'Something went wrong. Please try again later.'
                };
                console.error(err);
            })
            .finally(() => {
                res.render(view, vars);
                vars.flash = false;
            });
        });
    }
}

// app.post('/inquire', (req, res) => {
//     console.log(req);
// });

// app.get('/', (req, res) => res.render('index'));


app.listen(port, () => console.log(`Example app listening on port ${port}!`));
