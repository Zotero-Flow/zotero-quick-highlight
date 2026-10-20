"""Build a release from the manifest; publish only explicit runtime files."""
from pathlib import Path
import hashlib,json,subprocess,sys,zipfile
root=Path(__file__).resolve().parent.parent
manifest=json.loads((root/'manifest.json').read_text())
version=manifest['version']
if len(sys.argv)>1 and sys.argv[1] != 'v'+version:
 raise SystemExit('Tag does not match manifest version')
app=manifest['applications']['zotero']
repo=manifest['homepage_url']
assert app['update_url']==repo+'/releases/latest/download/updates.json'
dist=root/'dist';dist.mkdir(exist_ok=True)
asset='quick-highlight-{version}.xpi'.format(version=version)
xpi=dist/asset
with zipfile.ZipFile(xpi,'w',zipfile.ZIP_DEFLATED) as archive:
 for name in ['manifest.json','bootstrap.js','LICENSE','NOTICE']:
  info=zipfile.ZipInfo(name,(2026,1,1,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED
  archive.writestr(info,(root/name).read_bytes())
with zipfile.ZipFile(xpi) as archive:
 assert archive.testzip() is None
 assert json.loads(archive.read('manifest.json'))==manifest
 assert archive.read('bootstrap.js')==(root/'bootstrap.js').read_bytes()
digest=hashlib.sha256(xpi.read_bytes()).hexdigest()
update={'addons':{app['id']:{'updates':[{'version':version,'update_link':repo+'/releases/download/v'+version+'/'+asset,'update_hash':'sha256:'+digest,'applications':{'zotero':{k:app[k] for k in ['strict_min_version','strict_max_version']}}}]}}}
(dist/'updates.json').write_text(json.dumps(update,indent=2)+'\n')
# Keep the source update manifest in sync for users of the previous repository URL.
(root/'updates.json').write_text((dist/'updates.json').read_text())
(dist/'SHA256SUMS.txt').write_text(digest+'  '+asset+'\n'+hashlib.sha256((dist/'updates.json').read_bytes()).hexdigest()+'  updates.json\n')
print('Built',xpi.name,'SHA256',digest)
