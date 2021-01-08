const arrayToFile = args => {
   let mime;
   let content;

   switch (args.type) {
      case 'csv': {
         mime = 'text/csv';
         const csv = [];

         if (args.content.length)
            csv.push(Object.keys(args.content[0]).join(';'));

         for (const row of args.content)
            csv.push(Object.values(row).map(col => typeof col === 'string' ? `"${col}"` : col).join(';'));

         content = csv.join('\n');
         break;
      }
      case 'json':
         mime = 'application/json';
         content = JSON.stringify(args.content, null, 3);
         break;

      default:
         break;
   }

   const file = new Blob([content], { mime });
   const downloadLink = document.createElement('a');
   downloadLink.download = `${args.filename}.${args.type}`;
   downloadLink.href = window.URL.createObjectURL(file);
   downloadLink.style.display = 'none';
   document.body.appendChild(downloadLink);
   downloadLink.click();
};

export default arrayToFile;
