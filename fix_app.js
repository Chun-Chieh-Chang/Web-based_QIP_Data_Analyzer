const fs = require('fs');
const path = 'c:/Users/3kids/Downloads/Self-developed_Apps/QCTools/QIP/QIP_Data_Analyzer/frontend/src/App.jsx';
let content = fs.readFileSync(path, 'utf8').split('\n');

for (let i = 0; i < content.length; i++) {
    if (content[i].includes('STEP NAVIGATION CONTROLS')) {
        let skip = 0;
        for (let j = i; j < content.length; j++) {
            if (content[j].includes('</button>')) skip++;
            if (skip === 2) {
                // Correctly close batch analysis
                // We need 3 divs: 1 for step-controls, 1 for animate-in, 1 for flex container (601)
                content[j + 1] = '                    </div>'; // step-controls
                content[j + 2] = '                  </div>';   // animate-in/currentStep root
                content[j + 3] = '                </div>';     // flex container 601
                content[j + 4] = '              )}';           // conditional 600
                break;
            }
        }
        break;
    }
}

fs.writeFileSync(path, content.join('\n'));
