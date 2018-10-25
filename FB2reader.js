HTMLElement.prototype.appendChildren = function(...children){
	for(const child of children)
		this.appendChild(child)
}

class FB2Reader{

	constructor(bookEl){
		this.bookEl = this.generateAndRenderBookEl()
		this.encoding = "UTF-8"

		this.settingsEl = this.generateAndRenderSettingsEl()
		this.navigationEls = this.generateAndRenderNavigationEls()

		this.bookFile = null
		this.xml
		this.chapters = []
		this.currentChapter = null

		this.fileReader = new FileReader()
		this.fileReader.onloadend = ()=>this.checkEncoding()

		this.updateNavigation([ "openBook" ])
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
					title:
						chapter.match(/<title.*?>([\s\S]*?)<\/title>/)
						? chapter.replace(/<title.*?>([\s\S]*?)<\/title>[\s\S]*$/, "$1")
						: "",
					content: chapter
						.replace(/^[\s\n\r\t]*<title.*?>[\s\S]*?<\/title>/, "")
						.replace(/<empty-line\s*\/>/g, "<p class=\"empty-line\"></p>"),
					number: number
				}
				return chapter
			})

		this.bookFile = null
		this.xml = null
		// this.fileReader.result = null

		this.settingsEl.className = ""
		this.generateContents()
		this.openContents()
	}

	openContents(){
		console.log("meow")

		this.currentChapter = null
		this.updateNavigation([ "settings", "openBook" ])
		this.renderPage.apply(this, this.contentsPage)
		this.animateBook("bottom to top")
		window.scrollTo(0, 0)
	}

	openChapter(number){
		console.log("purr " + number)

		const chapter = this.chapters[number]
		
		const title = document.createElement("h2")
		title.innerHTML = chapter.title
		
		const content = document.createElement("section")
		content.innerHTML = chapter.content
		
		this.currentChapter = number
		this.updateNavigation([ "prev", "contents", "settings", "next" ])
		this.renderPage(title, content)
		window.scrollTo(0, 0)
	}

	openSettings(){
		if(this.settingsEl.classList.contains("open"))
			this.settingsEl.classList.remove("open")
		else
			this.settingsEl.classList.add("open")
	}


	animateBook(how){
		let axis, start, end

		switch (how) {
			case "right to left":
				axis = "left",
				start = "32px",
				end = 0
				break;
			case "left to right":
				axis = "left",
				start = "-32px",
				end = 0
				break;
			case "bottom to top":
				axis = "top",
				start = "32px",
				end = 0
				break;
			default:
				break;
		}
		
		const animation = {
			easing: [ "cubic-bezier(0.0, 0.0, 0.2, 1)", "cubic-bezier(0.0, 0.0, 0.2, 1)" ]
		}
		animation[axis] = [start, end]

		this.bookEl.animate(animation, 200)
	}


	updateNavigation(visibleElements){ //[ "___", "___" ]
		let first = null
		let last  = null

		for(const name of Object.keys(this.navigationEls)){
			const element = this.navigationEls[name]
	
			element.classList.remove("first")
			element.classList.remove("last")

			if(visibleElements.includes(name)){
				if(!first) first = element
				last = element
				element.classList.remove("hidden")
			}
			else
				element.classList.add("hidden")
		}
		if(first)
			first.classList.add("first")
		if(last)
			last.classList.add("last")
	}

	generateAndRenderBookEl(){
		const book = document.createElement("div")
		book.id = "book"
		document.body.appendChild(book)
		return book
	}

	generateAndRenderNavigationEls(){
		const navigation = document.createElement("nav")
		//
		const prev = document.createElement("button")
		prev.className = "prev"
		prev.innerHTML = "<img src=\"images/arrow.svg\" alt=\"\">"
		prev.onclick = e => {
			if(e.button === 0)
				if(this.currentChapter == null) return
				else if(this.currentChapter === 0)
					this.openContents()
				else{
					this.openChapter(this.currentChapter - 1)
					this.animateBook("left to right")
				}
		}
		//
		const contents = document.createElement("button")
		contents.className = "contents"
		contents.innerHTML = "<img src=\"images/list.svg\" alt=\"\">"
		contents.onclick = e => {
			if(e.button === 0)
				this.openContents()
		}
		//
		const openBook = document.createElement("button")
		openBook.className = "openBook"
		openBook.innerHTML = "<img src=\"images/book.svg\" alt=\"\">"
		openBook.onclick = e => {
			if(e.button === 0){
				const file = document.createElement("input")
				file.type = "file"
				file.setAttribute("accept",".fb2")
				file.onchange = () => {
					this.openBook(file.files[0])
				}
				file.click()
			}
		}
		//
		const settings = document.createElement("button")
		settings.className = "settings"
		settings.innerHTML = "<img src=\"images/gear.svg\" alt=\"\">"
		settings.onclick = e => {
			if(e.button === 0)
				this.openSettings()
		}
		//
		const next = document.createElement("button")
		next.className = "next"
		next.innerHTML = "<img src=\"images/arrow.svg\" alt=\"\">"
		next.onclick = e => {
			if(e.button === 0)
				if(this.currentChapter == null) return
				else if(this.currentChapter === this.chapters.length - 1)
					this.openContents()
				else{
					this.openChapter(this.currentChapter + 1)
					this.animateBook("right to left")
				}
		}
		//
		navigation.appendChildren(prev, contents, openBook, settings, next)
		document.body.appendChild(navigation)
		return { prev, contents, openBook, settings, next }
	}

	generateAndRenderSettingsEl(){
		const settings = document.createElement("div")
		settings.id = "settings"

		;(()=>{
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
			align.onclick = e => {
				if(e.button != 0) return

				let target = e.target.closest("button")
				if(!target) return

				let align = null
				switch (target) {
					case left   : align = "left" ;break;
					case center : align = "center" ;break;
					case justify: align = "justify" ;break;
					case right  : align = "right" ;break;
					default: return
				}
				this.bookEl.style.textAlign = align
			}
			align.appendChildren(left, center, justify, right)
			settings.appendChild(align)
		})()

		;(()=>{
			const font = document.createElement("div")
			font.className = "button-block"
			//
			const serif = document.createElement("button")
			serif.className = "serif"
			serif.innerText = "Aa"
			//
			const sans = document.createElement("button")
			sans.className = "sans"
			sans.innerText = "Aa"
			//
			const size = document.createElement("input")
			size.type = "number"
			size.className = "button"
			size.maxLength = 2
			size.placeholder = 16
			size.value = 16
			size.onchange = () => {
				this.bookEl.style.fontSize = size.value + "px"
			}
			//
			font.onclick = e => {
				if(e.button != 0) return

				const target = e.target.closest("button")
				if(!target) return

				let fontName
				switch (target) {
					case serif: fontName = "serif"		;break;
					case sans : fontName = "sans-serif"	;break;
					default: return
				}
				this.bookEl.style.fontFamily = fontName
			}
			//
			font.appendChildren(serif, sans, size)
			settings.appendChild(font)
		})()

		document.body.appendChild(settings)
		return settings
	}

	generateContents(){
		const page = document.createElement("div")
		page.className = "page"

		const title = document.createElement("h2")
		title.innerText = "Contents"

		const list = document.createElement("ol")
		list.className = "contents"

		for(const chapter of this.chapters){
			const li = document.createElement("li")
			li.className = "button"

			if(chapter.title.length > 0)
				li.innerHTML = chapter.title.replace(/<.*?>/g, "")
			else
				li.innerHTML = chapter.content.substr(0,100).replace(/(<.*?>)|(<.*[^>]$)/g, "").substr(0,60) + "..."
				
			li.addEventListener("click", e=>{
				if(e.button === 0){
					this.openChapter(chapter.number)
					this.animateBook("bottom to top")
				}
			})

			list.appendChild(li)
		}

		this.contentsPage = [title, list]
	}

	renderPage(...what){
		this.bookEl.innerHTML = ""
		for(const el of what)
			this.bookEl.appendChild(el)
	}
}