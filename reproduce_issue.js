const fs = require('fs');

// Mock Data from the chunk
const csvChunk = `id,title,reporter,category,summary,content,image_url,video_url,date\r
10,this is not showing,Goutam Ghosh,নদীয়া,write the content,nope,https://picsum.photos/seed/238/200/300,FALSE,20/02/2026\r
1,this is not showing,Goutam Ghosh,নদীয়া,নদিয়া জেলার বিজেপির অন্যতম প্রতিষ্ঠাতা সদস্য এবং সক্রিয় সংগঠক স্বর্গীয় বাসুদেব ঘোষের স্মরণে আয়োজিত হলো বার্ষিক শ্রদ্ধানুষ্ঠান। তাঁর মৃত্যুবার্ষিকী উপলক্ষে প্রতি বছরের মতো এবারও এলাকায় জাঁকজমকপূর্ণভাবে পালিত হলো এই অনুষ্ঠান। ,"নদিয়া জেলার বিজেপির অন্যতম প্রতিষ্ঠাতা সদস্য এবং সক্রিয় সংগঠক স্বর্গীয় বাসুদেব ঘোষের স্মরণে আয়োজিত হলো বার্ষিক শ্রদ্ধানুষ্ঠান। তাঁর মৃত্যুবার্ষিকী উপলক্ষে প্রতি বছরের মতো এবারও এলাকায় জাঁকজমকপূর্ণভাবে পালিত হলো এই অনুষ্ঠান। উপস্থিত ছিলেন স্থানীয় জনপ্রতিনিধি, বিজেপি নেতৃবৃন্দ, কর্মী এবং অসংখ্য সাধারণ মানুষ। ১৯৪৭সালের ১৫ আগস্ট ভারতের স্বাধীনতা দিবসের দিন নদিয়ার চাপড়া থানার টেংরা গ্রামে জন্মগ্রহণ করেন বাসুদেব ঘোষ। পেশায় তিনি ছিলেন প্রাথমিক বিদ্যালয়ের শিক্ষক। পড়াশোনা শুরু চাপড়া থেকে কৃষ্ণনগরে, তারপর যাদবপুর বিশ্ববিদ্যালয়ে উচ্চশিক্ষা শেষে আইন নিয়ে পড়া শুরু করেন। লেখক কমলেন্দু দাক্ষীত সহ বহু মানুষের খুব প্রিয় এবং কাছের মানুষ ছিলেন তিনি।অধ্যয়নের পাশাপাশি রাজনীতিতে যুক্ত হন এবং সমাজসেবামূলক কাজের মাধ্যমে জনপ্রিয়তা অর্জন করেন। দশকে নদীয়া জেলা ডিএম, ডিকে ঘোষ, এসপি, ভিকে সিং এর আমলে প্রশাসনের সাথে ইন্দো -পাকিস্তান যুদ্ধ এবং বন্যা পরিস্থিতির মোকাবিলায় এক দৃষ্টান্ত মূলক ভুমিকা পালন করেন।সত্তরের দশকে তিনি রাজ্য যুব কংগ্রেসের সহসভাপতি পদে দায়িত্ব পালন করেন এবং বেকার ভাতা আন্দোলনের রাজ্যের অন্যতম মুখ ছিলেন। কিন্তু মতবিরোধের কারণে যুব কংগ্রেস ছেড়ে দেশের জরুরি অবস্থার সময় এডভোকেট কাশীকান্ত মৈত্রের হাত ধরে যোগ দেন জনতা পার্টিতে। সেখান থেকেই শুরু হয় তাঁর রাজনৈতিক উত্থান। পরবর্তীতে জনসংঘে যুক্ত হন।",https://picsum.photos/seed/238/200/300,FALSE,10/01/2026`;

// App.js Logic
function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const currentline = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        if (currentline.length < 2) continue;

        const obj = {};
        headers.forEach((header, j) => {
            let val = currentline[j] ? currentline[j].trim() : '';
            if (val.startsWith('"') && val.endsWith('"')) {
                val = val.substring(1, val.length - 1);
            }
            obj[header] = val;
        });

        if (!obj.id) obj.id = 'news_' + i;

        if (obj.date) {
            const parts = obj.date.split('/');
            if (parts.length === 3) {
                obj.dateObj = new Date(parts[2], parts[1] - 1, parts[0]);
            } else {
                obj.dateObj = new Date(0);
            }
        } else {
            obj.dateObj = new Date(0);
        }

        if (obj.title) data.push(obj);
    }
    return data;
}

const parsedData = parseCSV(csvChunk);
console.log('Parsed Items:', parsedData.length);

if (parsedData.length > 0) {
    parsedData.forEach((item, idx) => {
        console.log(`\nItem ${idx + 1}:`);
        console.log('ID:', item.id);
        console.log('Title:', item.title);
        console.log('Category:', item.category);
        console.log('Category Code:', item.category.charCodeAt(0), item.category.charCodeAt(1), item.category.charCodeAt(2)); // Check encoding

        // Check Mapping
        const CATEGORY_MAPPING = {
            'nodiya': 'নদীয়া',
        };
        const mapped = CATEGORY_MAPPING['nodiya'];
        console.log('Expected Category:', mapped);
        console.log('Match?', item.category === mapped);

        // Debugging Normalization
        if (item.category !== mapped) {
            console.log('Mismatch details:');
            console.log('Item Cat Hex:', Buffer.from(item.category).toString('hex'));
            console.log('Mapped Cat Hex:', Buffer.from(mapped).toString('hex'));
        }
    });
}
