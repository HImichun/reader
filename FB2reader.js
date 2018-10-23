HTMLElement.prototype.appendChildren = function(...children){
	for(const child of children)
		this.appendChild(child)
}

class FB2Reader{

	constructor(bookEl){
		this.bookEl = this.generateAndRenderBookEl()
		this.encoding = "UTF-8"

		this.settingsEl = this.generateAndRenderSettingsEl()

		this.bookFile = null
		this.xml
		this.chapters = []
		this.currentChapter = null

		this.fileReader = new FileReader()
		this.fileReader.onloadend = ()=>this.checkEncoding()
	}

	openBook(file){
		console.log("Opening the book...")
		this.bookFile = file
		this.fileReader.readAsText(file,this.encoding)
	}
	
	checkEncoding(){
		console.log("Checking encoding...")
		this.xml = this.fileReader.result
		const encoding = this.xml.replace(/<\?xml.*?encoding\s?=\s?\"(.*?)\"[\s\S]*$/, "$1")
		const same = this.encoding == encoding

		if(same)
			this.bookOpened()
		else{
			console.log("Oops, wrong encoding... The right one is " + encoding)
			this.encoding = encoding
			this.fileReader.readAsText(this.bookFile,this.encoding)
			this.fileReader.onloadend = ()=>{
				this.xml = this.fileReader.result
				this.bookOpened()
			}
		}
	}
	bookOpened(){
		console.log("The book is now open (almost)!")
		this.fileReader.onloadend = ()=>this.checkEncoding()
		
		this.chapters = this.xml
			.match(/<section.*?>[\s\S]*?<\/section>/g)
			.map((chapter, number) => {
				chapter = chapter.replace(/(?:^[\n\r\s]*<section.*?>)|(?:<\/section>[\n\r\s]*$)/g, "")
				chapter = {
					title: chapter.match(/<title.*?>([\s\S]*?)<\/title>/)
						? chapter.replace(/<title.*?>([\s\S]*?)<\/title>[\s\S]*$/, "$1")
						: "",
					content: chapter.replace(/<title.*?>[\s\S]*?<\/title>/, ""),
					number: number
				}
				return chapter
			})

		this.openContents()
	}

	openContents(){
		console.log("meow")

		const title = document.createElement("h2")
		title.innerText = "Contents"

		const list = document.createElement("ol")
		list.className = "contents"

		for(const chapter of this.chapters){
			const li = document.createElement("li")
			li.className = "button"
			console.log(chapter.content.substr(0,100).replace(/<.*?>/g, "").substr(0,60) + "...")

			if(chapter.title.length > 0)
				li.innerHTML = chapter.title.replace(/<.*?>/g, "")
			else
				li.innerHTML = chapter.content.substr(0,100).replace(/(<.*?>)|(<.*[^>]$)/g, "").substr(0,60) + "..."
				
			li.addEventListener("click", e=>{
				if(e.button === 0)
					this.openChapter(chapter.number)
			})

			list.appendChild(li)
		}

		const navigation = document.createElement("nav")
		//
		const settings = document.createElement("button")
		settings.className = "settings"
		settings.innerHTML = "<img src=\"images/gear.svg\" alt=\"\">"
		settings.addEventListener("click", e=>{
			if(e.button === 0)
				this.openSettings()
		})
		//
		navigation.appendChild(settings)

		this.settingsEl.className = ""
		this.renderPage(title, list, navigation)
	}

	openChapter(number){
		console.log("purr " + number)

		const chapter = this.chapters[number]

		const title = document.createElement("h2")
		title.innerHTML = chapter.title

		const content = document.createElement("section")
		content.innerHTML = chapter.content

		const navigation = document.createElement("nav")
		//
		const prev = document.createElement("button")
		prev.className = "prev"
		prev.innerHTML = "<img src=\"images/arrow.svg\" alt=\"\">"
		prev.addEventListener("click", e=>{
			if(e.button === 0)
				if(number == 0)
					this.openContents()
				else
					this.openChapter(number - 1)
		})
		//
		const contents = document.createElement("button")
		contents.className = "contents"
		contents.innerHTML = "<img src=\"images/list.svg\" alt=\"\">"
		contents.addEventListener("click", e=>{
			if(e.button === 0)
				this.openContents()
		})
		//
		const settings = document.createElement("button")
		settings.className = "settings"
		settings.innerHTML = "<img src=\"images/gear.svg\" alt=\"\">"
		settings.addEventListener("click", e=>{
			if(e.button === 0)
				this.openSettings()
		})
		//
		const next = document.createElement("button")
		next.className = "next"
		next.innerHTML = "<img src=\"images/arrow.svg\" alt=\"\">"
		next.addEventListener("click", e=>{
			if(e.button === 0)
				if(number == this.chapters.length - 1)
					this.openContents()
				else
					this.openChapter(number + 1)
		})
		//
		navigation.appendChildren(prev, contents, settings, next)

		this.settingsEl.className = ""

		this.renderPage(title, content, navigation)
		window.scrollTo(0, 0)
	}

	openSettings(){
		if(this.settingsEl.classList.contains("open"))
			this.settingsEl.classList.remove("open")
		else
			this.settingsEl.classList.add("open")
	}

	generateAndRenderBookEl(){
		const book = document.createElement("div")
		book.id = "book"
		document.body.appendChild(book)
		return book
	}

	generateAndRenderSettingsEl(){
		const settings = document.createElement("div")
		settings.id = "settings"
		settings.className = "open";

		(()=>{
			const fileBlock = document.createElement("div")
			fileBlock.className = "button-block"
			//
			const label = document.createElement("label")
			label.className = "button"
			//
			const labelText = document.createElement("span")
			labelText.innerText = "choose an fb2 book"
			label.appendChild(labelText)
			//
			const file = document.createElement("input")
			file.type = "file"
			file.name = "input-file"
			file.setAttribute("accept",".fb2")
			label.appendChild(file)
			//
			const button = document.createElement("button")
			button.innerText = "open"
			button.disabled = true
			//
			file.addEventListener("change", ()=>{
				button.disabled = false
				labelText.innerText = file.files[0].name
			})
			button.addEventListener("click", e=>{
				if(e.button != 0) return
				button.disabled = true
				this.openBook(file.files[0])
			})
			//
			fileBlock.appendChildren(label, button)
			settings.appendChild(fileBlock)
		})();

		(()=>{
			const align = document.createElement("div")
			align.className = "button-block"
			//
			const left = document.createElement("button")
			left.innerHTML = "<img src=\"images/align-left.svg\" alt=\"\">"
			//
			const center = document.createElement("button")
			center.innerHTML = "<img src=\"images/align-center.svg\" alt=\"\">"
			//
			const justify = document.createElement("button")
			justify.innerHTML = "<img src=\"images/align-justify.svg\" alt=\"\">"
			//
			const right = document.createElement("button")
			right.innerHTML = "<img src=\"images/align-right.svg\" alt=\"\">"
			//
			align.addEventListener("click", e=>{
				if(e.button != 0) return
				let align = null
				switch (e.target) {
					case left   : align = "left" ;break;
					case center : align = "center" ;break;
					case justify: align = "justify" ;break;
					case right  : align = "right" ;break;
					default: return
				}
				this.bookEl.style.textAlign = align
			})
			align.appendChildren(left, center, justify, right)
			settings.appendChild(align)
		})()

		document.body.appendChild(settings)
		return settings
	}

	renderPage(...what){
		this.bookEl.innerHTML = ""
		for(const el of what)
			this.bookEl.appendChild(el)
	}
}